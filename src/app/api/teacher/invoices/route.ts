import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch invoices for the logged-in teacher
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  try {
    const teacher = await db.teacher.findUnique({
      where: { id: session.user.teacherId },
      include: { 
        studio: true,
        payRate: true
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // If action is "classes", fetch classes for invoice period
    if (action === "classes") {
      const startDate = searchParams.get("startDate")
      const endDate = searchParams.get("endDate")

      if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start and end date required" }, { status: 400 })
      }

      const classes = await db.classSession.findMany({
        where: {
          teacherId: session.user.teacherId,
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate + "T23:59:59")
          }
        },
        include: {
          classType: true,
          location: true,
          _count: { select: { bookings: true } }
        },
        orderBy: { startTime: "asc" }
      })

      // Calculate earnings based on pay rate
      const payRate = teacher.payRate
      const classesWithEarnings = classes.map(cls => {
        let earnings = 0
        if (payRate) {
          if (payRate.type === "PER_CLASS") {
            earnings = payRate.rate
          } else if (payRate.type === "HOURLY") {
            const hours = (new Date(cls.endTime).getTime() - new Date(cls.startTime).getTime()) / (1000 * 60 * 60)
            earnings = payRate.rate * hours
          } else if (payRate.type === "PER_STUDENT") {
            earnings = payRate.rate * cls._count.bookings
          }
        }

        return {
          id: cls.id,
          date: cls.startTime.toISOString().split("T")[0],
          startTime: cls.startTime.toISOString(),
          endTime: cls.endTime.toISOString(),
          classType: cls.classType.name,
          location: cls.location.name,
          students: cls._count.bookings,
          earnings: Math.round(earnings * 100) / 100
        }
      })

      const summary = {
        totalClasses: classesWithEarnings.length,
        totalStudents: classesWithEarnings.reduce((sum, c) => sum + c.students, 0),
        totalEarnings: classesWithEarnings.reduce((sum, c) => sum + c.earnings, 0)
      }

      return NextResponse.json({ 
        classes: classesWithEarnings, 
        summary,
        payRate: payRate ? {
          type: payRate.type,
          rate: payRate.rate,
          currency: payRate.currency
        } : null
      })
    }

    // Default: fetch all invoices
    const invoices = await db.teacherInvoice.findMany({
      where: {
        teacherId: session.user.teacherId
      },
      include: {
        studio: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Parse line items JSON
    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      lineItems: JSON.parse(inv.lineItems || "[]")
    }))

    return NextResponse.json({
      invoices: parsedInvoices,
      payRate: teacher.payRate,
      studio: {
        id: teacher.studio.id,
        name: teacher.studio.name
      }
    })
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST - Create a new invoice (submit to studio)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  try {
    const teacher = await db.teacher.findUnique({
      where: { id: session.user.teacherId },
      select: { studioId: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      periodStart,
      periodEnd,
      lineItems,
      subtotal,
      tax,
      taxRate,
      total,
      notes,
      submit = false // If true, set status to PENDING (submitted to studio)
    } = body

    // Generate invoice number
    const year = new Date().getFullYear()
    const count = await db.teacherInvoice.count({
      where: { studioId: teacher.studioId }
    })
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`

    const invoice = await db.teacherInvoice.create({
      data: {
        invoiceNumber,
        teacherId: session.user.teacherId,
        studioId: teacher.studioId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        lineItems: JSON.stringify(lineItems),
        subtotal,
        tax: tax || 0,
        taxRate: taxRate || 0,
        total,
        notes,
        status: submit ? "PENDING" : "DRAFT",
        sentAt: submit ? new Date() : null
      },
      include: {
        studio: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems)
    })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}

// PATCH - Update an invoice (cancel draft, resubmit)
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { invoiceId, action } = body

    const invoice = await db.teacherInvoice.findFirst({
      where: {
        id: invoiceId,
        teacherId: session.user.teacherId
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    if (action === "submit") {
      // Submit a draft invoice
      if (invoice.status !== "DRAFT") {
        return NextResponse.json({ error: "Only draft invoices can be submitted" }, { status: 400 })
      }
      updateData = { status: "PENDING", sentAt: new Date() }
    } else if (action === "cancel") {
      // Cancel a draft invoice
      if (invoice.status !== "DRAFT") {
        return NextResponse.json({ error: "Only draft invoices can be cancelled" }, { status: 400 })
      }
      updateData = { status: "CANCELLED" }
    }

    const updated = await db.teacherInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        studio: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      ...updated,
      lineItems: JSON.parse(updated.lineItems)
    })
  } catch (error) {
    console.error("Failed to update invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

// DELETE - Delete a draft invoice
export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get("invoiceId")

  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice ID required" }, { status: 400 })
  }

  try {
    const invoice = await db.teacherInvoice.findFirst({
      where: {
        id: invoiceId,
        teacherId: session.user.teacherId,
        status: "DRAFT"
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Draft invoice not found" }, { status: 404 })
    }

    await db.teacherInvoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete invoice:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}

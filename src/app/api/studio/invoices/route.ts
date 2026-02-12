import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all invoices for the studio
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const teacherId = searchParams.get("teacherId")

  try {
    // Build where clause
    const where: Record<string, unknown> = {
      studioId: session.user.studioId
    }

    if (status) {
      where.status = status
    }

    if (teacherId) {
      where.teacherId = teacherId
    }

    const invoices = await db.teacherInvoice.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Parse line items JSON
    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      lineItems: JSON.parse(inv.lineItems || "[]")
    }))

    // Get summary stats
    const stats = {
      total: invoices.length,
      pending: invoices.filter(inv => inv.status === "PENDING").length,
      paid: invoices.filter(inv => inv.status === "PAID").length,
      totalPending: invoices
        .filter(inv => inv.status === "PENDING")
        .reduce((sum, inv) => sum + inv.total, 0),
      totalPaid: invoices
        .filter(inv => inv.status === "PAID")
        .reduce((sum, inv) => sum + inv.total, 0)
    }

    return NextResponse.json({
      invoices: parsedInvoices,
      stats
    })
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// PATCH - Update invoice status (mark as paid, etc.)
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { invoiceId, status, paidAmount, paymentMethod, paymentReference, notes } = body

    // Verify invoice belongs to this studio
    const invoice = await db.teacherInvoice.findFirst({
      where: {
        id: invoiceId,
        studioId: session.user.studioId
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
      
      if (status === "PAID") {
        updateData.paidAt = new Date()
        updateData.paidAmount = paidAmount ?? invoice.total
        if (paymentMethod) updateData.paymentMethod = paymentMethod
        if (paymentReference) updateData.paymentReference = paymentReference
      }
      
      if (status === "SENT") {
        updateData.sentAt = new Date()
      }
    }

    if (notes !== undefined) {
      // Studio can add notes to the invoice
      const currentNotes = invoice.notes || ""
      updateData.notes = currentNotes ? `${currentNotes}\n\n[Studio Note]: ${notes}` : `[Studio Note]: ${notes}`
    }

    const updated = await db.teacherInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
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

















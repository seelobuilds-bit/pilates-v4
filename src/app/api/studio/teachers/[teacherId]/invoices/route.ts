import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch invoices for a teacher
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getSession()
  const { teacherId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const invoices = await db.teacherInvoice.findMany({
      where: {
        teacherId,
        studioId: session.user.studioId
      },
      orderBy: { createdAt: "desc" }
    })

    // Parse line items JSON
    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      lineItems: JSON.parse(inv.lineItems || "[]")
    }))

    return NextResponse.json(parsedInvoices)
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

// POST - Create a new invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getSession()
  const { teacherId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
      sendEmail
    } = body

    // Generate invoice number
    const year = new Date().getFullYear()
    const count = await db.teacherInvoice.count({
      where: { studioId: session.user.studioId }
    })
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`

    const invoice = await db.teacherInvoice.create({
      data: {
        invoiceNumber,
        teacherId,
        studioId: session.user.studioId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        lineItems: JSON.stringify(lineItems),
        subtotal,
        tax: tax || 0,
        taxRate: taxRate || 0,
        total,
        notes,
        status: sendEmail ? "SENT" : "DRAFT",
        sentAt: sendEmail ? new Date() : null
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    // If sendEmail, send the invoice email
    if (sendEmail && invoice.teacher.user.email) {
      // In production, integrate with email service
      // For now, just mark as sent
      console.log(`Would send invoice ${invoiceNumber} to ${invoice.teacher.user.email}`)
    }

    return NextResponse.json({
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems)
    })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}




















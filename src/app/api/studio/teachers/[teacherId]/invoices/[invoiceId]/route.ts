import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch a single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string; invoiceId: string }> }
) {
  const session = await getSession()
  const { teacherId, invoiceId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const invoice = await db.teacherInvoice.findFirst({
      where: {
        id: invoiceId,
        teacherId,
        studioId: session.user.studioId
      },
      include: {
        teacher: {
          include: { user: true }
        },
        studio: true
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems)
    })
  } catch (error) {
    console.error("Failed to fetch invoice:", error)
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

// PATCH - Update invoice (mark as paid, send, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string; invoiceId: string }> }
) {
  const session = await getSession()
  const { teacherId, invoiceId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status, paidAmount, paymentMethod, paymentReference, sendEmail } = body

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status
      if (status === "PAID") {
        updateData.paidAt = new Date()
        if (paidAmount !== undefined) updateData.paidAmount = paidAmount
        if (paymentMethod) updateData.paymentMethod = paymentMethod
        if (paymentReference) updateData.paymentReference = paymentReference
      }
      if (status === "SENT") {
        updateData.sentAt = new Date()
      }
    }

    const invoice = await db.teacherInvoice.update({
      where: {
        id: invoiceId,
        teacherId,
        studioId: session.user.studioId
      },
      data: updateData,
      include: {
        teacher: {
          include: { user: true }
        }
      }
    })

    // Send email if requested
    if (sendEmail && invoice.teacher.user.email) {
      console.log(`Would send invoice ${invoice.invoiceNumber} to ${invoice.teacher.user.email}`)
    }

    return NextResponse.json({
      ...invoice,
      lineItems: JSON.parse(invoice.lineItems)
    })
  } catch (error) {
    console.error("Failed to update invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

// DELETE - Delete a draft invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string; invoiceId: string }> }
) {
  const session = await getSession()
  const { teacherId, invoiceId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Only allow deleting draft invoices
    const invoice = await db.teacherInvoice.findFirst({
      where: {
        id: invoiceId,
        teacherId,
        studioId: session.user.studioId,
        status: "DRAFT"
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or cannot be deleted" }, { status: 404 })
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






















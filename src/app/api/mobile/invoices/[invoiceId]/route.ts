import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

type InvoiceLineItem = {
  description?: string
  classId?: string
  quantity?: number
  rate?: number
  amount?: number
}

function parseLineItems(lineItems: string): InvoiceLineItem[] {
  try {
    const parsed = JSON.parse(lineItems)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          description: typeof item.description === "string" ? item.description : "Line item",
          classId: typeof item.classId === "string" ? item.classId : undefined,
          quantity: typeof item.quantity === "number" ? item.quantity : undefined,
          rate: typeof item.rate === "number" ? item.rate : undefined,
          amount: typeof item.amount === "number" ? item.amount : undefined,
        }))
    }
    return []
  } catch {
    return []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Invoices are only available for studio and teacher accounts" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const { invoiceId } = await params

    const invoice = await db.teacherInvoice.findFirst({
      where: {
        id: invoiceId,
        studioId: studio.id,
        ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        lineItems: true,
        subtotal: true,
        tax: true,
        taxRate: true,
        total: true,
        paidAmount: true,
        paymentMethod: true,
        paymentReference: true,
        currency: true,
        notes: true,
        sentAt: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        periodStart: invoice.periodStart.toISOString(),
        periodEnd: invoice.periodEnd.toISOString(),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        taxRate: invoice.taxRate,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        paymentMethod: invoice.paymentMethod,
        paymentReference: invoice.paymentReference,
        currency: invoice.currency,
        notes: invoice.notes,
        sentAt: invoice.sentAt?.toISOString() || null,
        paidAt: invoice.paidAt?.toISOString() || null,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        teacher: {
          id: invoice.teacher.id,
          firstName: invoice.teacher.user.firstName,
          lastName: invoice.teacher.user.lastName,
          email: invoice.teacher.user.email,
        },
        lineItems: parseLineItems(invoice.lineItems),
      },
    })
  } catch (error) {
    console.error("Mobile invoice detail error:", error)
    return NextResponse.json({ error: "Failed to load invoice detail" }, { status: 500 })
  }
}

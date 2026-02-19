import { PaymentStatus, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const ALLOWED_STATUSES = new Set<PaymentStatus>([
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
])

function toMajorCurrency(amountInMinorUnits: number) {
  return amountInMinorUnits / 100
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Payments are available for studio owner accounts only" }, { status: 403 })
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

    const statusRaw = String(request.nextUrl.searchParams.get("status") || "all").toUpperCase()
    const parsedStatus = ALLOWED_STATUSES.has(statusRaw as PaymentStatus) ? (statusRaw as PaymentStatus) : null
    const status: "all" | PaymentStatus = parsedStatus || "all"
    const search = String(request.nextUrl.searchParams.get("search") || "").trim()

    const where: Prisma.PaymentWhereInput = {
      studioId: studio.id,
    }

    if (parsedStatus) {
      where.status = parsedStatus
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { lastName: { contains: search, mode: "insensitive" } } },
        { client: { email: { contains: search, mode: "insensitive" } } },
      ]
    }

    const payments = await db.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        createdAt: true,
        receiptUrl: true,
        failureMessage: true,
        refundedAmount: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    })

    const stats = payments.reduce(
      (acc, payment) => {
        acc.total += 1
        if (payment.status === "PENDING" || payment.status === "PROCESSING") acc.pending += 1
        if (payment.status === "SUCCEEDED") acc.succeeded += 1
        if (payment.status === "FAILED") acc.failed += 1
        if (payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED") acc.refunded += 1

        if (payment.status === "SUCCEEDED" || payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED") {
          acc.grossProcessed += toMajorCurrency(payment.amount)
        }

        if (payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED") {
          acc.refundedTotal += payment.refundedAmount ?? toMajorCurrency(payment.amount)
        }
        return acc
      },
      {
        total: 0,
        pending: 0,
        succeeded: 0,
        failed: 0,
        refunded: 0,
        grossProcessed: 0,
        refundedTotal: 0,
      }
    )

    return NextResponse.json({
      role: "OWNER",
      studio: studioSummary,
      status,
      stats,
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: toMajorCurrency(payment.amount),
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt.toISOString(),
        receiptUrl: payment.receiptUrl,
        failureMessage: payment.failureMessage,
        refundedAmount: payment.refundedAmount,
        bookingCount: payment._count.bookings,
        client: {
          id: payment.client.id,
          firstName: payment.client.firstName,
          lastName: payment.client.lastName,
          email: payment.client.email,
        },
      })),
    })
  } catch (error) {
    console.error("Mobile payments error:", error)
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 })
  }
}

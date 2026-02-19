import { NextRequest, NextResponse } from "next/server"
import { InvoiceStatus, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const ALLOWED_STATUSES = new Set<InvoiceStatus>(["DRAFT", "PENDING", "SENT", "PAID", "CANCELLED"])

function buildOwnerSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    OR: [
      { invoiceNumber: { contains: normalized, mode: "insensitive" as const } },
      {
        teacher: {
          user: {
            firstName: {
              contains: normalized,
              mode: "insensitive" as const,
            },
          },
        },
      },
      {
        teacher: {
          user: {
            lastName: {
              contains: normalized,
              mode: "insensitive" as const,
            },
          },
        },
      },
      {
        teacher: {
          user: {
            email: {
              contains: normalized,
              mode: "insensitive" as const,
            },
          },
        },
      },
    ],
  }
}

function buildTeacherSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    invoiceNumber: { contains: normalized, mode: "insensitive" as const },
  }
}

function summarizeInvoiceStats(
  invoices: Array<{ status: InvoiceStatus; total: number; paidAmount: number | null }>
) {
  let pending = 0
  let paid = 0
  let totalPending = 0
  let totalPaid = 0

  for (const invoice of invoices) {
    if (invoice.status === "PENDING" || invoice.status === "SENT") {
      pending += 1
      totalPending += invoice.total
      continue
    }

    if (invoice.status === "PAID") {
      paid += 1
      totalPaid += invoice.paidAmount ?? invoice.total
    }
  }

  return {
    total: invoices.length,
    pending,
    paid,
    totalPending,
    totalPaid,
  }
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

    const search = String(request.nextUrl.searchParams.get("search") || "")
    const statusRaw = String(request.nextUrl.searchParams.get("status") || "all").toUpperCase()
    const parsedStatus = ALLOWED_STATUSES.has(statusRaw as InvoiceStatus) ? (statusRaw as InvoiceStatus) : null
    const status: "all" | InvoiceStatus = parsedStatus || "all"

    const where: Prisma.TeacherInvoiceWhereInput = {
      studioId: studio.id,
      ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
    }

    if (parsedStatus) {
      where.status = parsedStatus
    }

    const searchWhere = decoded.role === "OWNER" ? buildOwnerSearchWhere(search) : buildTeacherSearchWhere(search)
    if (searchWhere) {
      Object.assign(where, searchWhere)
    }

    const invoices = await db.teacherInvoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        subtotal: true,
        tax: true,
        total: true,
        paidAmount: true,
        currency: true,
        sentAt: true,
        paidAt: true,
        createdAt: true,
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
      orderBy: { createdAt: "desc" },
      take: 250,
    })

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      status,
      stats: summarizeInvoiceStats(invoices),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        periodStart: invoice.periodStart.toISOString(),
        periodEnd: invoice.periodEnd.toISOString(),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        currency: invoice.currency,
        sentAt: invoice.sentAt?.toISOString() || null,
        paidAt: invoice.paidAt?.toISOString() || null,
        createdAt: invoice.createdAt.toISOString(),
        teacher: invoice.teacher
          ? {
              id: invoice.teacher.id,
              firstName: invoice.teacher.user.firstName,
              lastName: invoice.teacher.user.lastName,
              email: invoice.teacher.user.email,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error("Mobile invoices error:", error)
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 })
  }
}

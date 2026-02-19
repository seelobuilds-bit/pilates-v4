import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function buildSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    OR: [
      { firstName: { contains: normalized, mode: "insensitive" as const } },
      { lastName: { contains: normalized, mode: "insensitive" as const } },
      { email: { contains: normalized, mode: "insensitive" as const } },
      { phone: { contains: normalized, mode: "insensitive" as const } },
    ],
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
      return NextResponse.json({ error: "Clients are only available for studio and teacher accounts" }, { status: 403 })
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
    const searchWhere = buildSearchWhere(search)

    if (decoded.role === "OWNER") {
      const clients = await db.client.findMany({
        where: {
          studioId: studio.id,
          ...(searchWhere || {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
            },
          },
          bookings: {
            select: {
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 250,
      })

      return NextResponse.json({
        role: "OWNER",
        studio: studioSummary,
        clients: clients.map((client) => ({
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          isActive: client.isActive,
          totalBookings: client._count.bookings,
          lastBookingAt: client.bookings[0]?.createdAt?.toISOString() || null,
          createdAt: client.createdAt.toISOString(),
        })),
      })
    }

    if (!decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const teacherBookings = await db.booking.findMany({
      where: {
        studioId: studio.id,
        classSession: {
          teacherId: decoded.teacherId,
        },
        ...(searchWhere
          ? {
              client: searchWhere,
            }
          : {}),
      },
      select: {
        clientId: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1200,
    })

    const byClient = new Map<
      string,
      {
        id: string
        firstName: string
        lastName: string
        email: string
        phone: string | null
        isActive: boolean
        totalBookings: number
        lastBookingAt: string | null
        createdAt: string
      }
    >()

    for (const booking of teacherBookings) {
      const existing = byClient.get(booking.clientId)
      if (!existing) {
        byClient.set(booking.clientId, {
          id: booking.client.id,
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          email: booking.client.email,
          phone: booking.client.phone,
          isActive: booking.client.isActive,
          totalBookings: 1,
          lastBookingAt: booking.createdAt.toISOString(),
          createdAt: booking.client.createdAt.toISOString(),
        })
        continue
      }

      existing.totalBookings += 1
      if (!existing.lastBookingAt || booking.createdAt.getTime() > new Date(existing.lastBookingAt).getTime()) {
        existing.lastBookingAt = booking.createdAt.toISOString()
      }
    }

    const clients = Array.from(byClient.values()).sort((a, b) => {
      if (a.lastBookingAt && b.lastBookingAt) {
        return new Date(b.lastBookingAt).getTime() - new Date(a.lastBookingAt).getTime()
      }
      if (a.lastBookingAt) return -1
      if (b.lastBookingAt) return 1
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })

    return NextResponse.json({
      role: "TEACHER",
      studio: studioSummary,
      clients: clients.slice(0, 250),
    })
  } catch (error) {
    console.error("Mobile clients error:", error)
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 })
  }
}

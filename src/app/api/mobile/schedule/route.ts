import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function parseDateOrFallback(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
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

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const from = parseDateOrFallback(request.nextUrl.searchParams.get("from"), new Date())
    const defaultTo = new Date(from)
    defaultTo.setDate(defaultTo.getDate() + 14)
    const to = parseDateOrFallback(request.nextUrl.searchParams.get("to"), defaultTo)

    if (to < from) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 })
    }

    if (decoded.role === "OWNER" || decoded.role === "TEACHER") {
      const sessions = await db.classSession.findMany({
        where: {
          studioId: studio.id,
          startTime: {
            gte: from,
            lte: to,
          },
          ...(decoded.role === "TEACHER" && decoded.teacherId
            ? { teacherId: decoded.teacherId }
            : {}),
        },
        include: {
          classType: {
            select: { id: true, name: true },
          },
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          location: {
            select: { id: true, name: true },
          },
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { startTime: "asc" },
        take: 300,
      })

      return NextResponse.json({
        role: decoded.role,
        studio,
        from: from.toISOString(),
        to: to.toISOString(),
        items: sessions.map((session) => ({
          id: session.id,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime.toISOString(),
          capacity: session.capacity,
          bookedCount: session._count.bookings,
          classType: {
            id: session.classType.id,
            name: session.classType.name,
          },
          teacher: {
            id: session.teacherId,
            firstName: session.teacher.user.firstName,
            lastName: session.teacher.user.lastName,
          },
          location: {
            id: session.location.id,
            name: session.location.name,
          },
        })),
      })
    }

    const clientId = decoded.clientId || decoded.sub
    const bookings = await db.booking.findMany({
      where: {
        studioId: studio.id,
        clientId,
        classSession: {
          startTime: {
            gte: from,
            lte: to,
          },
        },
      },
      include: {
        classSession: {
          include: {
            classType: {
              select: { id: true, name: true },
            },
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            location: {
              select: { id: true, name: true },
            },
            _count: {
              select: { bookings: true },
            },
          },
        },
      },
      orderBy: {
        classSession: {
          startTime: "asc",
        },
      },
      take: 300,
    })

    return NextResponse.json({
      role: "CLIENT",
      studio,
      from: from.toISOString(),
      to: to.toISOString(),
      items: bookings.map((booking) => ({
        id: booking.classSession.id,
        bookingId: booking.id,
        bookingStatus: booking.status,
        startTime: booking.classSession.startTime.toISOString(),
        endTime: booking.classSession.endTime.toISOString(),
        capacity: booking.classSession.capacity,
        bookedCount: booking.classSession._count.bookings,
        classType: {
          id: booking.classSession.classType.id,
          name: booking.classSession.classType.name,
        },
        teacher: {
          id: booking.classSession.teacherId,
          firstName: booking.classSession.teacher.user.firstName,
          lastName: booking.classSession.teacher.user.lastName,
        },
        location: {
          id: booking.classSession.location.id,
          name: booking.classSession.location.name,
        },
      })),
    })
  } catch (error) {
    console.error("Mobile schedule error:", error)
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 })
  }
}

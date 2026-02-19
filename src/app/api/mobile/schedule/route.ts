import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function parseDateOrFallback(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function mapSession(session: {
  id: string
  startTime: Date
  endTime: Date
  capacity: number
  teacherId: string
  classType: { id: string; name: string; price: number }
  teacher: { user: { firstName: string; lastName: string } }
  location: { id: string; name: string }
  _count: { bookings: number }
}) {
  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    capacity: session.capacity,
    bookedCount: session._count.bookings,
    classType: {
      id: session.classType.id,
      name: session.classType.name,
      price: session.classType.price,
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

    const from = parseDateOrFallback(request.nextUrl.searchParams.get("from"), new Date())
    const defaultTo = new Date(from)
    defaultTo.setDate(defaultTo.getDate() + 14)
    const to = parseDateOrFallback(request.nextUrl.searchParams.get("to"), defaultTo)
    const mode = request.nextUrl.searchParams.get("mode") || "booked"

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
          ...(decoded.role === "TEACHER" && decoded.teacherId ? { teacherId: decoded.teacherId } : {}),
        },
        include: {
          classType: {
            select: { id: true, name: true, price: true },
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
        studio: studioSummary,
        from: from.toISOString(),
        to: to.toISOString(),
        mode,
        items: sessions.map(mapSession),
      })
    }

    const clientId = decoded.clientId || decoded.sub

    if (mode === "all") {
      const [sessions, bookings] = await Promise.all([
        db.classSession.findMany({
          where: {
            studioId: studio.id,
            startTime: {
              gte: from,
              lte: to,
            },
          },
          include: {
            classType: {
              select: { id: true, name: true, price: true },
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
        }),
        db.booking.findMany({
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
          select: {
            id: true,
            status: true,
            classSessionId: true,
          },
        }),
      ])

      const bookingsBySession = new Map(bookings.map((booking) => [booking.classSessionId, booking]))

      return NextResponse.json({
        role: "CLIENT",
        studio: studioSummary,
        from: from.toISOString(),
        to: to.toISOString(),
        mode,
        items: sessions.map((session) => {
          const booking = bookingsBySession.get(session.id)
          return {
            ...mapSession(session),
            bookingId: booking?.id,
            bookingStatus: booking?.status,
          }
        }),
      })
    }

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
              select: { id: true, name: true, price: true },
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
      studio: studioSummary,
      from: from.toISOString(),
      to: to.toISOString(),
      mode,
      items: bookings.map((booking) => ({
        ...mapSession(booking.classSession),
        bookingId: booking.id,
        bookingStatus: booking.status,
      })),
    })
  } catch (error) {
    console.error("Mobile schedule error:", error)
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 })
  }
}

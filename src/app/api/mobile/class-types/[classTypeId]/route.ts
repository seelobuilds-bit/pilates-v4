import { BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ratioPercentage, roundCurrency, roundTo } from "@/lib/reporting/metrics"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const ATTENDED_STATUSES = new Set<BookingStatus>(["CONFIRMED", "COMPLETED", "NO_SHOW"])
const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

function bookingRevenue(booking: { paidAmount: number | null; classSession: { classType: { price: number } } }) {
  return booking.paidAmount ?? booking.classSession.classType.price ?? 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
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
      return NextResponse.json({ error: "Class detail is available for studio and teacher accounts only" }, { status: 403 })
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

    const { classTypeId } = await params

    const classType = await db.classType.findFirst({
      where: {
        id: classTypeId,
        studioId: studio.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        capacity: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!classType) {
      return NextResponse.json({ error: "Class type not found" }, { status: 404 })
    }

    const sessionsWhere = {
      studioId: studio.id,
      classTypeId: classType.id,
      ...(decoded.role === "TEACHER" && decoded.teacherId ? { teacherId: decoded.teacherId } : {}),
    }

    const [sessions, bookings] = await Promise.all([
      db.classSession.findMany({
        where: sessionsWhere,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          capacity: true,
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          bookings: {
            select: {
              status: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
        take: 250,
      }),
      db.booking.findMany({
        where: {
          studioId: studio.id,
          classSession: sessionsWhere,
        },
        select: {
          status: true,
          paidAmount: true,
          classSession: {
            select: {
              classType: {
                select: {
                  price: true,
                },
              },
            },
          },
        },
      }),
    ])

    const now = new Date()
    const upcomingSessions = sessions.filter((session) => session.startTime >= now).length

    const totalCapacity = sessions.reduce((sum, session) => sum + session.capacity, 0)
    const totalAttended = sessions.reduce(
      (sum, session) => sum + session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length,
      0
    )

    const nonCancelledBookings = bookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))
    const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED")

    const totalRevenue = roundCurrency(nonCancelledBookings.reduce((sum, booking) => sum + bookingRevenue(booking), 0))
    const fillRate = ratioPercentage(totalAttended, totalCapacity, 1)
    const completionRate = ratioPercentage(completedBookings.length, nonCancelledBookings.length, 1)

    const locationDistribution = new Map<string, number>()
    for (const session of sessions) {
      const label = session.location.name
      locationDistribution.set(label, (locationDistribution.get(label) || 0) + 1)
    }

    const topLocations = Array.from(locationDistribution.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      classType: {
        id: classType.id,
        name: classType.name,
        description: classType.description,
        duration: classType.duration,
        capacity: classType.capacity,
        price: classType.price,
        isActive: classType.isActive,
        createdAt: classType.createdAt.toISOString(),
      },
      stats: {
        totalSessions: sessions.length,
        upcomingSessions,
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        fillRate,
        completionRate,
        totalRevenue,
        averageRevenuePerSession: sessions.length > 0 ? roundTo(totalRevenue / sessions.length, 2) : 0,
      },
      topLocations,
      recentSessions: sessions.slice(0, 20).map((session) => ({
        id: session.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        capacity: session.capacity,
        bookedCount: session.bookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length,
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.user.firstName,
          lastName: session.teacher.user.lastName,
        },
        location: {
          id: session.location.id,
          name: session.location.name,
        },
      })),
    })
  } catch (error) {
    console.error("Mobile class type detail error:", error)
    return NextResponse.json({ error: "Failed to load class type detail" }, { status: 500 })
  }
}

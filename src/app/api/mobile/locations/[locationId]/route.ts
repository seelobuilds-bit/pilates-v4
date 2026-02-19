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
  { params }: { params: Promise<{ locationId: string }> }
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
      return NextResponse.json({ error: "Location detail is available for studio and teacher accounts only" }, { status: 403 })
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

    const { locationId } = await params

    const location = await db.location.findFirst({
      where: {
        id: locationId,
        studioId: studio.id,
        ...(decoded.role === "TEACHER"
          ? {
              classSessions: {
                some: {
                  teacherId: decoded.teacherId!,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const [sessions, bookings] = await Promise.all([
      db.classSession.findMany({
        where: {
          studioId: studio.id,
          locationId: location.id,
          ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          capacity: true,
          classType: {
            select: {
              id: true,
              name: true,
            },
          },
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
          classSession: {
            locationId: location.id,
            ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
          },
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

    const classDistribution = new Map<string, number>()
    for (const session of sessions) {
      const classType = session.classType.name
      classDistribution.set(classType, (classDistribution.get(classType) || 0) + 1)
    }

    const topClassTypes = Array.from(classDistribution.entries())
      .map(([classType, count]) => ({ classType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      location: {
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        phone: location.phone,
        isActive: location.isActive,
        createdAt: location.createdAt.toISOString(),
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
      topClassTypes,
      recentSessions: sessions.slice(0, 20).map((session) => ({
        id: session.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        capacity: session.capacity,
        bookedCount: session.bookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length,
        classType: {
          id: session.classType.id,
          name: session.classType.name,
        },
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.user.firstName,
          lastName: session.teacher.user.lastName,
        },
      })),
    })
  } catch (error) {
    console.error("Mobile location detail error:", error)
    return NextResponse.json({ error: "Failed to load location detail" }, { status: 500 })
  }
}

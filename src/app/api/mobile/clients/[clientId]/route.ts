import { BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { roundCurrency } from "@/lib/reporting/metrics"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

function bookingValue(booking: { paidAmount: number | null; classSession: { classType: { price: number } } }) {
  return booking.paidAmount ?? booking.classSession.classType.price ?? 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
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
      return NextResponse.json({ error: "Client detail is only available for studio and teacher accounts" }, { status: 403 })
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

    const { clientId } = await params
    const client = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: studio.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const bookingsWhere = {
      studioId: studio.id,
      clientId: client.id,
      ...(decoded.role === "TEACHER" && decoded.teacherId
        ? {
            classSession: {
              teacherId: decoded.teacherId,
            },
          }
        : {}),
    }

    if (decoded.role === "TEACHER") {
      if (!decoded.teacherId) {
        return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
      }

      const scopedBookings = await db.booking.count({ where: bookingsWhere })
      if (scopedBookings === 0) {
        return NextResponse.json({ error: "Client not available in this teacher scope" }, { status: 404 })
      }
    }

    const bookings = await db.booking.findMany({
      where: bookingsWhere,
      select: {
        id: true,
        status: true,
        paidAmount: true,
        createdAt: true,
        classSession: {
          select: {
            startTime: true,
            endTime: true,
            classType: {
              select: {
                id: true,
                name: true,
                price: true,
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
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
    })

    const nonCancelledBookings = bookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))
    const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED")
    const cancelledBookings = bookings.filter((booking) => booking.status === "CANCELLED")
    const noShowBookings = bookings.filter((booking) => booking.status === "NO_SHOW")

    const totalSpent = roundCurrency(nonCancelledBookings.reduce((sum, booking) => sum + bookingValue(booking), 0))

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive,
        createdAt: client.createdAt.toISOString(),
        lastBookingAt: bookings[0]?.createdAt?.toISOString() || null,
        stats: {
          totalBookings: bookings.length,
          completedBookings: completedBookings.length,
          cancelledBookings: cancelledBookings.length,
          noShowBookings: noShowBookings.length,
          totalSpent,
        },
      },
      recentBookings: bookings.slice(0, 20).map((booking) => ({
        id: booking.id,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        paidAmount: roundCurrency(bookingValue(booking)),
        classSession: {
          startTime: booking.classSession.startTime.toISOString(),
          endTime: booking.classSession.endTime.toISOString(),
          classType: {
            id: booking.classSession.classType.id,
            name: booking.classSession.classType.name,
          },
          teacher: {
            id: booking.classSession.teacher.id,
            firstName: booking.classSession.teacher.user.firstName,
            lastName: booking.classSession.teacher.user.lastName,
          },
          location: {
            id: booking.classSession.location.id,
            name: booking.classSession.location.name,
          },
        },
      })),
    })
  } catch (error) {
    console.error("Mobile client detail error:", error)
    return NextResponse.json({ error: "Failed to load client detail" }, { status: 500 })
  }
}

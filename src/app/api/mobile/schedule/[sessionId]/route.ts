import { BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const ACTIVE_BOOKING_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type BookingCounter = {
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
}

function createBookingCounter(): BookingCounter {
  return {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  }
}

function incrementCounter(counter: BookingCounter, status: BookingStatus) {
  if (status === "PENDING") counter.pending += 1
  else if (status === "CONFIRMED") counter.confirmed += 1
  else if (status === "COMPLETED") counter.completed += 1
  else if (status === "CANCELLED") counter.cancelled += 1
  else if (status === "NO_SHOW") counter.noShow += 1
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
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

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher account is missing teacher scope" }, { status: 403 })
    }

    const { sessionId } = await params
    const session = await db.classSession.findFirst({
      where: {
        id: sessionId,
        studioId: studio.id,
        ...(decoded.role === "TEACHER" && decoded.teacherId ? { teacherId: decoded.teacherId } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        capacity: true,
        notes: true,
        classType: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
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
                email: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        bookings: {
          orderBy: {
            createdAt: "desc",
          },
          take: 200,
          select: {
            id: true,
            clientId: true,
            status: true,
            paidAmount: true,
            createdAt: true,
            cancelledAt: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            waitlists: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const bookingSummary = createBookingCounter()
    for (const booking of session.bookings) {
      incrementCounter(bookingSummary, booking.status)
    }

    const bookedCount = session.bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.has(booking.status)).length
    const remainingSpots = Math.max(session.capacity - bookedCount, 0)

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const basePayload = {
      role: decoded.role,
      studio: studioSummary,
      session: {
        id: session.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        capacity: session.capacity,
        bookedCount,
        remainingSpots,
        waitlistCount: session._count.waitlists,
        notes: session.notes,
        classType: {
          id: session.classType.id,
          name: session.classType.name,
          description: session.classType.description,
          duration: session.classType.duration,
          price: session.classType.price,
        },
        teacher: {
          id: session.teacher.id,
          firstName: session.teacher.user.firstName,
          lastName: session.teacher.user.lastName,
          email: session.teacher.user.email,
        },
        location: {
          id: session.location.id,
          name: session.location.name,
          address: session.location.address,
          city: session.location.city,
          state: session.location.state,
          zipCode: session.location.zipCode,
        },
        bookingSummary,
      },
    }

    if (decoded.role === "CLIENT") {
      const clientId = decoded.clientId || decoded.sub
      const clientBooking = session.bookings.find((booking) => booking.clientId === clientId) || null
      const classStartsInFuture = session.startTime > new Date()
      const isFreeClass = session.classType.price <= 0
      const isPaidClass = session.classType.price > 0
      const hasActiveBooking =
        !!clientBooking && clientBooking.status !== "CANCELLED" && clientBooking.status !== "NO_SHOW"

      return NextResponse.json({
        ...basePayload,
        clientBooking: clientBooking
          ? {
              id: clientBooking.id,
              status: clientBooking.status,
              paidAmount: clientBooking.paidAmount,
              createdAt: clientBooking.createdAt.toISOString(),
              cancelledAt: clientBooking.cancelledAt?.toISOString() || null,
            }
          : null,
        canBook: classStartsInFuture && isFreeClass && remainingSpots > 0 && !hasActiveBooking,
        canCheckoutOnWeb: classStartsInFuture && isPaidClass && remainingSpots > 0 && !hasActiveBooking,
      })
    }

    return NextResponse.json({
      ...basePayload,
      recentBookings: session.bookings.slice(0, 50).map((booking) => ({
        id: booking.id,
        status: booking.status,
        paidAmount: booking.paidAmount,
        createdAt: booking.createdAt.toISOString(),
        cancelledAt: booking.cancelledAt?.toISOString() || null,
        client: {
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          email: booking.client.email,
        },
      })),
    })
  } catch (error) {
    console.error("Mobile schedule session detail error:", error)
    return NextResponse.json({ error: "Failed to load schedule session detail" }, { status: 500 })
  }
}

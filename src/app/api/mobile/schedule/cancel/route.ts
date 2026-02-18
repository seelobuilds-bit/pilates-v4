import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { sendMobilePushNotification } from "@/lib/mobile-push"

function formatStartTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "CLIENT") {
      return NextResponse.json({ error: "Only clients can cancel bookings" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: { id: true, subdomain: true, ownerId: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const bookingId = String(body?.bookingId || "").trim()

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 })
    }

    const clientId = decoded.clientId || decoded.sub

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        studioId: studio.id,
        clientId,
      },
      select: {
        id: true,
        status: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        classSession: {
          select: {
            id: true,
            startTime: true,
            classType: {
              select: {
                name: true,
              },
            },
            teacher: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ success: true, bookingId: booking.id, status: booking.status })
    }

    if (booking.classSession.startTime < new Date()) {
      return NextResponse.json({ error: "Cannot cancel a past class booking" }, { status: 400 })
    }

    const cancelled = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: "Cancelled via mobile app",
      },
      select: {
        id: true,
        status: true,
      },
    })

    try {
      const targetUserIds = Array.from(new Set([studio.ownerId, booking.classSession.teacher.userId]))
      await sendMobilePushNotification({
        studioId: studio.id,
        userIds: targetUserIds,
        title: "Booking cancelled",
        body: `${booking.client.firstName} ${booking.client.lastName} cancelled ${booking.classSession.classType.name} (${formatStartTime(booking.classSession.startTime)})`,
        data: {
          type: "mobile_booking_cancelled",
          bookingId: cancelled.id,
          classSessionId: booking.classSession.id,
          clientId: booking.client.id,
        },
      })
    } catch (pushError) {
      console.error("Mobile booking cancellation push failed:", pushError)
    }

    return NextResponse.json({ success: true, bookingId: cancelled.id, status: cancelled.status })
  } catch (error) {
    console.error("Mobile schedule cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}

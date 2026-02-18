import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

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
      select: { id: true, subdomain: true },
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
        classSession: {
          select: {
            startTime: true,
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

    return NextResponse.json({ success: true, bookingId: cancelled.id, status: cancelled.status })
  } catch (error) {
    console.error("Mobile schedule cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}

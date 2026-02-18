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
      return NextResponse.json({ error: "Only clients can book classes" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: { id: true, subdomain: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const classSessionId = String(body?.classSessionId || "").trim()

    if (!classSessionId) {
      return NextResponse.json({ error: "classSessionId is required" }, { status: 400 })
    }

    const clientId = decoded.clientId || decoded.sub

    const classSession = await db.classSession.findFirst({
      where: {
        id: classSessionId,
        studioId: studio.id,
      },
      include: {
        classType: {
          select: { id: true, name: true, price: true },
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  in: ["PENDING", "CONFIRMED", "COMPLETED"],
                },
              },
            },
          },
        },
      },
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class session not found" }, { status: 404 })
    }

    if (classSession.startTime < new Date()) {
      return NextResponse.json({ error: "Cannot book a class in the past" }, { status: 400 })
    }

    if (classSession.classType.price > 0) {
      return NextResponse.json(
        { error: "Paid classes must be booked on web checkout for now" },
        { status: 400 }
      )
    }

    if (classSession._count.bookings >= classSession.capacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 409 })
    }

    const existingBooking = await db.booking.findUnique({
      where: {
        clientId_classSessionId: {
          clientId,
          classSessionId: classSession.id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    })

    if (existingBooking) {
      if (existingBooking.status === "CANCELLED" || existingBooking.status === "NO_SHOW") {
        const reactivated = await db.booking.update({
          where: { id: existingBooking.id },
          data: {
            status: "CONFIRMED",
            cancelledAt: null,
            cancellationReason: null,
          },
        })

        return NextResponse.json({ success: true, bookingId: reactivated.id, status: reactivated.status })
      }

      return NextResponse.json({ error: "You are already booked in this class" }, { status: 409 })
    }

    const booking = await db.booking.create({
      data: {
        studioId: studio.id,
        clientId,
        classSessionId: classSession.id,
        status: "CONFIRMED",
        paidAmount: 0,
      },
      select: {
        id: true,
        status: true,
      },
    })

    return NextResponse.json({ success: true, bookingId: booking.id, status: booking.status })
  } catch (error) {
    console.error("Mobile schedule book error:", error)
    return NextResponse.json({ error: "Failed to book class" }, { status: 500 })
  }
}

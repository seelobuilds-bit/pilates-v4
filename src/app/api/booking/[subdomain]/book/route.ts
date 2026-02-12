import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"
import { sendBookingConfirmationEmail } from "@/lib/email"
import { lockClassSession } from "@/lib/db-locks"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Please sign in to book" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { classSessionId, bookingType, recurringWeeks, packSize } = body

    // NOTE: This endpoint is intended for free bookings (no Stripe).
    // Paid bookings must go through the PaymentIntent flow.
    const booking = await db.$transaction(async (tx) => {
      // Lock the class session row to prevent overbooking races
      await lockClassSession(tx, classSessionId)

      const classSession = await tx.classSession.findFirst({
        where: { id: classSessionId, studioId: studio.id },
        include: {
          classType: true,
          teacher: { include: { user: true } },
          location: true,
        },
      })

      if (!classSession) {
        throw new Error("Class not found")
      }

      // Check if class has started (can't book past classes)
      if (new Date(classSession.startTime) < new Date()) {
        throw new Error("This class has already started")
      }

      // Calculate amount (in dollars)
      let amount = classSession.classType.price
      if (bookingType === "recurring") {
        amount = classSession.classType.price * (recurringWeeks || 4) * 0.9
      } else if (bookingType === "pack") {
        amount = classSession.classType.price * (packSize || 5) * 0.85
      }

      if (amount > 0) {
        throw new Error("Payment required")
      }

      // Prevent double booking
      const existingBooking = await tx.booking.findFirst({
        where: {
          clientId: decoded.clientId,
          classSessionId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        select: { id: true },
      })

      if (existingBooking) {
        throw new Error("You have already booked this class")
      }

      // Capacity check (active bookings only)
      const activeBookingsCount = await tx.booking.count({
        where: {
          classSessionId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      })

      if (activeBookingsCount >= classSession.capacity) {
        throw new Error("Class is full")
      }

      return tx.booking.create({
        data: {
          studioId: studio.id,
          clientId: decoded.clientId,
          classSessionId,
          status: "CONFIRMED",
          paidAmount: 0,
        },
        include: {
          client: true,
          classSession: {
            include: {
              classType: true,
              teacher: { include: { user: true } },
              location: true,
            },
          },
        },
      })
    })

    // Send booking confirmation email
    console.log(`[BOOKING] Sending confirmation email to ${booking.client.email}`)
    sendBookingConfirmationEmail({
      studioId: studio.id,
      studioName: studio.name,
      clientEmail: booking.client.email,
      clientName: booking.client.firstName,
      booking: {
        bookingId: booking.id,
        className: booking.classSession.classType.name,
        teacherName: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        locationName: booking.classSession.location.name,
        locationAddress: booking.classSession.location.address || undefined,
        startTime: booking.classSession.startTime,
        endTime: booking.classSession.endTime,
        amount: undefined,
        status: booking.status
      },
      manageBookingUrl: `https://${subdomain}.thecurrent.app/account`
    }).then(result => {
      console.log(`[BOOKING] Email result:`, result)
    }).catch(err => {
      console.error('[BOOKING] Failed to send booking confirmation:', err)
    })

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id,
      status: booking.status,
      requiresPayment: false,
      amount: 0,
      classDetails: {
        name: booking.classSession.classType.name,
        startTime: booking.classSession.startTime,
        location: booking.classSession.location.name,
        teacher: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`
      }
    })
  } catch (error) {
    console.error("Booking error:", error)

    const message = error instanceof Error ? error.message : "Failed to create booking"
    if (message === "Payment required") {
      return NextResponse.json({ error: "Payment required for this class" }, { status: 400 })
    }
    if (message === "Class not found") {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }
    if (message === "This class has already started") {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === "Class is full") {
      return NextResponse.json(
        { error: "Class is full", spotsLeft: 0, canJoinWaitlist: true },
        { status: 400 }
      )
    }
    if (message === "You have already booked this class") {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

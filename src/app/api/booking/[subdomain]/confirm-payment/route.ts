import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

// POST - Confirm payment succeeded and create booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { paymentIntentId, paymentId } = body

    // Get studio
    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        stripeAccountId: true,
      },
    })

    if (!studio || !studio.stripeAccountId) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const stripe = getStripe()

    // Verify payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { stripeAccount: studio.stripeAccountId }
    )

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ 
        error: "Payment not completed",
        status: paymentIntent.status 
      }, { status: 400 })
    }

    // Get payment record
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 })
    }

    // Update payment status
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCEEDED",
        stripeChargeId: paymentIntent.latest_charge as string,
      },
    })

    // Get class session ID from metadata
    const classSessionId = paymentIntent.metadata.classSessionId
    const clientId = paymentIntent.metadata.clientId

    if (!classSessionId || !clientId) {
      return NextResponse.json({ error: "Missing booking information" }, { status: 400 })
    }

    // Check if booking already exists (idempotency)
    const existingBooking = await db.booking.findFirst({
      where: {
        clientId,
        classSessionId,
        paymentId: payment.id,
      },
    })

    if (existingBooking) {
      // Booking already created, return it
      const booking = await db.booking.findUnique({
        where: { id: existingBooking.id },
        include: {
          classSession: {
            include: {
              classType: true,
              teacher: { include: { user: true } },
              location: true,
            },
          },
          client: true,
        },
      })

      return NextResponse.json({
        success: true,
        booking: {
          id: booking?.id,
          className: booking?.classSession.classType.name,
          date: booking?.classSession.startTime,
          location: booking?.classSession.location.name,
          teacher: `${booking?.classSession.teacher.user.firstName} ${booking?.classSession.teacher.user.lastName}`,
          price: payment.amount / 100,
        },
      })
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        clientId,
        classSessionId,
        studioId: studio.id,
        status: "CONFIRMED",
        paymentId: payment.id,
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
        client: true,
      },
    })

    // Queue confirmation email (if you have email setup)
    // This would trigger the email via your communications system

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        className: booking.classSession.classType.name,
        date: booking.classSession.startTime,
        location: booking.classSession.location.name,
        teacher: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        price: payment.amount / 100,
      },
    })
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}












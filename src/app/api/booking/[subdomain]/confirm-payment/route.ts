import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { sendBookingConfirmationEmail } from "@/lib/email"

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
        name: true,
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

    // Check if client already has an active booking for this class (ANY payment)
    const existingActiveBooking = await db.booking.findFirst({
      where: {
        clientId,
        classSessionId,
        status: { in: ["CONFIRMED", "PENDING"] }
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

    if (existingActiveBooking) {
      // Client already booked this class - return the existing booking
      // TODO: Consider refunding this payment since they already booked
      console.log(`[BOOKING] Client ${clientId} already has booking for class ${classSessionId}`)
      
      return NextResponse.json({
        success: true,
        alreadyBooked: true,
        message: "You have already booked this class",
        booking: {
          id: existingActiveBooking.id,
          className: existingActiveBooking.classSession.classType.name,
          date: existingActiveBooking.classSession.startTime,
          location: existingActiveBooking.classSession.location.name,
          teacher: `${existingActiveBooking.classSession.teacher.user.firstName} ${existingActiveBooking.classSession.teacher.user.lastName}`,
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
        paidAmount: payment.amount / 100,
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
        amount: payment.amount / 100,
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
    // Check if it's a unique constraint violation (duplicate booking)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: "You have already booked this class" 
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}




























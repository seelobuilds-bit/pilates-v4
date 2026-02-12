import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { sendBookingConfirmationEmail } from "@/lib/email"
import { lockClassSession } from "@/lib/db-locks"

// POST - Confirm payment succeeded and create booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { paymentIntentId, paymentId } = body

    if (!paymentIntentId || !paymentId) {
      return NextResponse.json(
        { error: "paymentIntentId and paymentId are required" },
        { status: 400 }
      )
    }

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

    if (payment.studioId !== studio.id) {
      return NextResponse.json({ error: "Payment does not belong to this studio" }, { status: 400 })
    }

    if (payment.stripePaymentIntentId && payment.stripePaymentIntentId !== paymentIntentId) {
      return NextResponse.json({ error: "Payment mismatch" }, { status: 400 })
    }

    // Update payment status
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCEEDED",
        stripeChargeId: paymentIntent.latest_charge as string,
        stripePaymentIntentId: paymentIntentId,
      },
    })

    // Get class session ID from metadata
    const classSessionId = paymentIntent.metadata.classSessionId
    const clientId = paymentIntent.metadata.clientId

    if (!classSessionId || !clientId) {
      return NextResponse.json({ error: "Missing booking information" }, { status: 400 })
    }

    const decision = await db.$transaction(async (tx) => {
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
        return { kind: "NOT_FOUND" as const }
      }

      if (new Date(classSession.startTime) < new Date()) {
        return { kind: "STARTED" as const }
      }

      // Duplicate booking check (any payment)
      const existingActiveBooking = await tx.booking.findFirst({
        where: {
          clientId,
          classSessionId,
          status: { in: ["CONFIRMED", "PENDING"] },
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
        if (existingActiveBooking.paymentId === payment.id) {
          return { kind: "ALREADY_BOOKED" as const, booking: existingActiveBooking }
        }
        return { kind: "DUPLICATE" as const, existingBookingId: existingActiveBooking.id }
      }

      // Capacity check
      const activeBookingsCount = await tx.booking.count({
        where: {
          classSessionId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      })

      if (activeBookingsCount >= classSession.capacity) {
        return { kind: "FULL" as const }
      }

      const booking = await tx.booking.create({
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

      return { kind: "BOOKED" as const, booking }
    })

    if (decision.kind === "ALREADY_BOOKED") {
      return NextResponse.json({
        success: true,
        booking: {
          id: decision.booking.id,
          className: decision.booking.classSession.classType.name,
          date: decision.booking.classSession.startTime,
          location: decision.booking.classSession.location.name,
          teacher: `${decision.booking.classSession.teacher.user.firstName} ${decision.booking.classSession.teacher.user.lastName}`,
          price: payment.amount / 100,
        },
      })
    }

    if (decision.kind !== "BOOKED") {
      // Payment succeeded but we couldn't create a booking. Refund immediately.
      try {
        const refund = await stripe.refunds.create(
          { payment_intent: paymentIntentId },
          { stripeAccount: studio.stripeAccountId }
        )

        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            stripeRefundId: refund.id,
            refundedAmount: (refund.amount || paymentIntent.amount_received || 0) / 100,
            refundedAt: new Date(),
          },
        })
      } catch (refundErr) {
        console.error("[BOOKING] Refund failed:", refundErr)
        // Keep payment as SUCCEEDED if refund fails; manual intervention required.
      }

      if (decision.kind === "DUPLICATE") {
        return NextResponse.json(
          { error: "You have already booked this class" },
          { status: 400 }
        )
      }

      if (decision.kind === "FULL") {
        return NextResponse.json(
          { error: "Class is full" },
          { status: 400 }
        )
      }

      if (decision.kind === "STARTED") {
        return NextResponse.json(
          { error: "This class has already started" },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const booking = decision.booking

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
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}


























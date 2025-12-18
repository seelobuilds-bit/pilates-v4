import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import Stripe from "stripe"

// Disable body parsing, we need the raw body for webhook verification
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(paymentIntent)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent)
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        await handleRefund(charge)
        break
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdate(account)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { clientId, studioId, classSessionId } = session.metadata || {}

  if (!clientId || !studioId || !classSessionId) {
    console.error("Missing metadata in checkout session")
    return
  }

  // Update payment record
  const payment = await db.payment.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  })

  if (payment) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        stripePaymentIntentId: session.payment_intent as string,
      },
    })

    // Create the booking
    const booking = await db.booking.create({
      data: {
        status: "CONFIRMED",
        paidAmount: (session.amount_total || 0) / 100,
        studioId,
        clientId,
        classSessionId,
        paymentId: payment.id,
      },
    })

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(studioId, clientId, classSessionId, booking.id)
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
      // Don't fail the booking if email fails
    }
  }
}

async function sendBookingConfirmationEmail(
  studioId: string, 
  clientId: string, 
  classSessionId: string,
  bookingId: string
) {
  // Fetch all the details needed for the email
  const [studio, client, classSession] = await Promise.all([
    db.studio.findUnique({ 
      where: { id: studioId },
      include: { emailConfig: true }
    }),
    db.client.findUnique({ where: { id: clientId } }),
    db.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
      }
    })
  ])

  if (!studio || !client || !classSession) {
    console.error("Missing data for confirmation email")
    return
  }

  // Format date and time
  const dateStr = new Date(classSession.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long", 
    day: "numeric",
    year: "numeric"
  })
  const timeStr = new Date(classSession.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  })

  // Create email content
  const subject = `Booking Confirmed - ${classSession.classType.name}`
  const body = `
Hi ${client.firstName},

Your booking has been confirmed! Here are your details:

📅 Class: ${classSession.classType.name}
🕐 Date & Time: ${dateStr} at ${timeStr}
📍 Location: ${classSession.location.name}, ${classSession.location.address}
👤 Instructor: ${classSession.teacher.user.firstName} ${classSession.teacher.user.lastName}

What to bring:
- Comfortable workout clothes
- Water bottle
- Yoga mat (if you have one)

Need to cancel or reschedule? Visit your account page or contact us.

See you soon!
${studio.name}
  `.trim()

  // Store the message in the database (even if we can't send it)
  await db.message.create({
    data: {
      type: "EMAIL",
      direction: "OUTBOUND",
      status: studio.emailConfig ? "SENT" : "PENDING",
      subject,
      body,
      fromAddress: studio.emailConfig?.fromEmail || `noreply@${studio.subdomain}.cadence.studio`,
      fromName: studio.name,
      toAddress: client.email,
      toName: `${client.firstName} ${client.lastName}`,
      sentAt: studio.emailConfig ? new Date() : null,
      studioId,
      clientId,
    }
  })

  // If email is configured, actually send it (using the communications service)
  // For now, we just store it - the actual sending would happen through the email provider
  console.log(`Booking confirmation email queued for ${client.email}`)
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const payment = await db.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  if (payment) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        netAmount: paymentIntent.amount_received,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
      },
    })
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payment = await db.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  if (payment) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureMessage: paymentIntent.last_payment_error?.message,
      },
    })
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const payment = await db.payment.findFirst({
    where: { stripeChargeId: charge.id },
  })

  if (payment) {
    const refundedAmount = charge.amount_refunded
    const isFullRefund = refundedAmount >= charge.amount

    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        refundedAmount: refundedAmount / 100,
        refundedAt: new Date(),
      },
    })

    // If full refund, cancel the booking
    if (isFullRefund) {
      const booking = await db.booking.findFirst({
        where: { paymentId: payment.id },
      })

      if (booking) {
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        })
      }
    }
  }
}

async function handleAccountUpdate(account: Stripe.Account) {
  // Update studio's Stripe status
  const studio = await db.studio.findFirst({
    where: { stripeAccountId: account.id },
  })

  if (studio) {
    await db.studio.update({
      where: { id: studio.id },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
      },
    })
  }
}

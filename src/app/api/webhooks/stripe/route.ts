import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { sendBookingConfirmationEmail } from "@/lib/email"
import { lockClassSession } from "@/lib/db-locks"
import { trackSocialLinkConversion } from "@/lib/social-tracking"
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

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice, event.account || null)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
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
  const { clientId, studioId, classSessionId, trackingCode } = session.metadata || {}

  if (!clientId || !studioId || !classSessionId) {
    console.error("Missing metadata in checkout session")
    return
  }

  // Update payment record
  const payment = await db.payment.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  })

  if (payment) {
    // Mark payment succeeded (idempotent)
    if (payment.status !== "SUCCEEDED") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          stripePaymentIntentId: session.payment_intent as string,
        },
      })
    }

    // Create the booking atomically (avoid duplicates / overbooking)
    const result = await db.$transaction(async (tx) => {
      await lockClassSession(tx, classSessionId)

      const classSession = await tx.classSession.findFirst({
        where: { id: classSessionId, studioId },
        include: {
          classType: true,
          teacher: { include: { user: true } },
          location: true,
        },
      })

      if (!classSession) return { kind: "NO_CLASS" as const }

      const existingBooking = await tx.booking.findFirst({
        where: {
          clientId,
          classSessionId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        select: { id: true },
      })
      if (existingBooking) return { kind: "DUPLICATE" as const, bookingId: existingBooking.id }

      const activeBookingsCount = await tx.booking.count({
        where: {
          classSessionId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      })
      if (activeBookingsCount >= classSession.capacity) return { kind: "FULL" as const }

      const booking = await tx.booking.create({
        data: {
          status: "CONFIRMED",
          paidAmount: (session.amount_total || 0) / 100,
          studioId,
          clientId,
          classSessionId,
          paymentId: payment.id,
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

      return { kind: "BOOKED" as const, booking }
    })

    if (result.kind === "BOOKED") {
      if (trackingCode) {
        void trackSocialLinkConversion({
          studioId,
          trackingCode,
          bookingId: result.booking.id,
          revenue: (session.amount_total || 0) / 100,
          fingerprint: result.booking.id
        }).catch((trackingError) => {
          console.error("[WEBHOOK] Failed to track social conversion:", trackingError)
        })
      }

      const studioRecord = await db.studio.findUnique({
        where: { id: studioId },
        select: { name: true, subdomain: true },
      })
      const baseUrl = (process.env.NEXTAUTH_URL || "https://thecurrent.app").replace(/\/$/, "")
      const manageBookingUrl = studioRecord?.subdomain
        ? `${baseUrl}/${studioRecord.subdomain}/account`
        : `${baseUrl}/account`

      // Send confirmation email (best effort)
      void sendBookingConfirmationEmail({
        studioId,
        studioName: studioRecord?.name || "Studio",
        clientEmail: result.booking.client.email,
        clientName: result.booking.client.firstName,
        booking: {
          bookingId: result.booking.id,
          className: result.booking.classSession.classType.name,
          teacherName: `${result.booking.classSession.teacher.user.firstName} ${result.booking.classSession.teacher.user.lastName}`,
          locationName: result.booking.classSession.location.name,
          locationAddress: result.booking.classSession.location.address || undefined,
          startTime: result.booking.classSession.startTime,
          endTime: result.booking.classSession.endTime,
          amount: (session.amount_total || 0) / 100,
          status: result.booking.status,
        },
        manageBookingUrl,
      }).catch((e) => console.error("Failed to send booking confirmation email:", e))
    } else {
      console.log("[WEBHOOK] checkout.session.completed booking skipped:", result.kind)
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const latestCharge = paymentIntent.latest_charge
  const receiptUrl =
    latestCharge && typeof latestCharge !== "string"
      ? latestCharge.receipt_url || null
      : null

  const payment = await db.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  })

  if (payment) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        netAmount: paymentIntent.amount_received,
        receiptUrl,
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
        failureMessage: `Stripe webhook refund processed (charge=${charge.id}, refunded=${(refundedAmount / 100).toFixed(2)})`,
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
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: "Cancelled after Stripe refund webhook (full refund)",
          },
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

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): string {
  if (status === "active" || status === "trialing") return "active"
  if (status === "past_due" || status === "unpaid") return "past_due"
  if (status === "canceled") return "cancelled"
  return "paused"
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription
  if (!subscriptionRef) return null
  if (typeof subscriptionRef === "string") return subscriptionRef
  return subscriptionRef.id
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: Date; end: Date } | null {
  const firstItem = subscription.items.data[0]
  if (!firstItem) return null

  return {
    start: new Date(firstItem.current_period_start * 1000),
    end: new Date(firstItem.current_period_end * 1000),
  }
}

function extractInvoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  const paymentIntentRef = (
    invoice as Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null }
  ).payment_intent
  if (!paymentIntentRef) return null
  if (typeof paymentIntentRef === "string") return paymentIntentRef
  return paymentIntentRef.id
}

function parseIntMetadata(value: string | undefined) {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function matchesAnchorDayAndTime(
  startTime: Date,
  anchorWeekdayUtc: number,
  anchorMinutesUtc: number
) {
  const weekday = startTime.getUTCDay()
  const minutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes()
  return weekday === anchorWeekdayUtc && minutes === anchorMinutesUtc
}

async function handleWeeklyClassInvoicePayment(
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription
) {
  if (subscription.metadata?.type !== "weekly_class_booking") return false

  const studioId = subscription.metadata.studioId
  const clientId = subscription.metadata.clientId
  const classTypeId = subscription.metadata.classTypeId
  const teacherId = subscription.metadata.teacherId
  const locationId = subscription.metadata.locationId

  if (!studioId || !clientId || !classTypeId || !teacherId || !locationId) {
    console.error("[WEBHOOK] Missing weekly booking metadata on subscription:", subscription.id)
    return true
  }

  const paymentIntentId = extractInvoicePaymentIntentId(invoice)
  const paidAmount = (invoice.amount_paid || invoice.amount_due || 0) / 100
  const currency = invoice.currency || "usd"

  let paymentId: string | undefined
  if (paymentIntentId) {
    const existingPayment = await db.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true },
    })

    if (existingPayment) {
      paymentId = existingPayment.id
      await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "SUCCEEDED",
          amount: invoice.amount_paid || invoice.amount_due || 0,
          currency,
          description: "Weekly class subscription renewal",
        },
      })
    } else {
      const createdPayment = await db.payment.create({
        data: {
          amount: invoice.amount_paid || invoice.amount_due || 0,
          currency,
          status: "SUCCEEDED",
          stripePaymentIntentId: paymentIntentId,
          description: "Weekly class subscription renewal",
          studioId,
          clientId,
        },
      })
      paymentId = createdPayment.id
    }
  }

  const anchorWeekdayUtc = parseIntMetadata(subscription.metadata.anchorWeekdayUtc)
  const anchorMinutesUtc = parseIntMetadata(subscription.metadata.anchorMinutesUtc)
  const now = new Date()

  const upcomingSessions = await db.classSession.findMany({
    where: {
      studioId,
      classTypeId,
      teacherId,
      locationId,
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    take: 24,
    include: {
      classType: true,
      teacher: { include: { user: true } },
      location: true,
    },
  })

  let targetSession =
    anchorWeekdayUtc !== null && anchorMinutesUtc !== null
      ? upcomingSessions.find((session) =>
          matchesAnchorDayAndTime(session.startTime, anchorWeekdayUtc, anchorMinutesUtc)
        )
      : undefined

  if (!targetSession) {
    targetSession = upcomingSessions[0]
  }

  if (!targetSession) {
    await db.client.update({
      where: { id: clientId },
      data: { credits: { increment: 1 } },
    })
    return true
  }

  const bookingResult = await db.$transaction(async (tx) => {
    await lockClassSession(tx, targetSession.id)

    const duplicate = await tx.booking.findFirst({
      where: {
        clientId,
        classSessionId: targetSession.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { id: true },
    })
    if (duplicate) return { kind: "DUPLICATE" as const }

    const activeBookingsCount = await tx.booking.count({
      where: {
        classSessionId: targetSession.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    })

    if (activeBookingsCount >= targetSession.capacity) {
      return { kind: "FULL" as const }
    }

    const booking = await tx.booking.create({
      data: {
        studioId,
        clientId,
        classSessionId: targetSession.id,
        status: "CONFIRMED",
        paymentId,
        paidAmount,
      },
      include: {
        client: true,
      },
    })

    return { kind: "BOOKED" as const, booking }
  })

  if (bookingResult.kind === "FULL") {
    await db.client.update({
      where: { id: clientId },
      data: { credits: { increment: 1 } },
    })
    return true
  }

  if (bookingResult.kind === "DUPLICATE") {
    return true
  }

  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: { name: true, subdomain: true },
  })

  const baseUrl = (process.env.NEXTAUTH_URL || "https://thecurrent.app").replace(/\/$/, "")
  const manageBookingUrl = studio?.subdomain
    ? `${baseUrl}/${studio.subdomain}/account`
    : `${baseUrl}/account`

  void sendBookingConfirmationEmail({
    studioId,
    studioName: studio?.name || "Studio",
    clientEmail: bookingResult.booking.client.email,
    clientName: bookingResult.booking.client.firstName,
    booking: {
      bookingId: bookingResult.booking.id,
      className: targetSession.classType.name,
      teacherName: `${targetSession.teacher.user.firstName} ${targetSession.teacher.user.lastName}`,
      locationName: targetSession.location.name,
      locationAddress: targetSession.location.address || undefined,
      startTime: targetSession.startTime,
      endTime: targetSession.endTime,
      amount: paidAmount,
      status: bookingResult.booking.status,
    },
    manageBookingUrl,
  }).catch((error) => {
    console.error("[WEBHOOK] Failed sending weekly booking email:", error)
  })

  return true
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const status = normalizeSubscriptionStatus(subscription.status)
  const shouldSetCancelledAt =
    status === "cancelled" ||
    Boolean(subscription.cancel_at_period_end) ||
    Boolean(subscription.canceled_at)
  const period = getSubscriptionPeriod(subscription)

  const updateData: {
    status: string
    cancelledAt: Date | null
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  } = {
    status,
    cancelledAt: shouldSetCancelledAt
      ? new Date((subscription.canceled_at || Math.floor(Date.now() / 1000)) * 1000)
      : null,
  }

  if (period) {
    updateData.currentPeriodStart = period.start
    updateData.currentPeriodEnd = period.end
  }

  await db.vaultSubscriber.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const period = getSubscriptionPeriod(subscription)

  const updateData: {
    status: string
    cancelledAt: Date
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  } = {
    status: "cancelled",
    cancelledAt: new Date((subscription.canceled_at || Math.floor(Date.now() / 1000)) * 1000),
  }

  if (period) {
    updateData.currentPeriodStart = period.start
    updateData.currentPeriodEnd = period.end
  }

  await db.vaultSubscriber.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: updateData,
  })
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  connectedAccountId: string | null
) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  if (connectedAccountId) {
    try {
      const stripe = getStripe()
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        stripeAccount: connectedAccountId,
      })
      const handled = await handleWeeklyClassInvoicePayment(invoice, subscription)
      if (handled) return
    } catch (error) {
      console.error("[WEBHOOK] Failed weekly subscription handling:", error)
    }
  }

  const updateData: {
    status: string
    paidAmount?: number
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  } = {
    status: "active",
  }

  if (typeof invoice.amount_paid === "number") {
    updateData.paidAmount = invoice.amount_paid / 100
  }

  if (typeof invoice.period_start === "number" && typeof invoice.period_end === "number") {
    updateData.currentPeriodStart = new Date(invoice.period_start * 1000)
    updateData.currentPeriodEnd = new Date(invoice.period_end * 1000)
  }

  await db.vaultSubscriber.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: updateData,
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return

  await db.vaultSubscriber.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: "past_due",
    },
  })
}

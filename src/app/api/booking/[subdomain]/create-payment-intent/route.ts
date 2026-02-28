import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe, calculatePlatformFee } from "@/lib/stripe"
import { normalizeSocialTrackingCode } from "@/lib/social-tracking"
import { ensureStripeCustomerForConnectedAccount } from "@/lib/stripe-customers"
import Stripe from "stripe"

type BookingType = "single" | "recurring" | "pack"

function getBookingType(value: unknown): BookingType {
  if (value === "recurring" || value === "pack") return value
  return "single"
}

function getPackSize(value: unknown) {
  const parsed = Number(value)
  return [5, 10, 20].includes(parsed) ? parsed : 5
}

// POST - Create payment setup for booking flow.
// - single/pack: PaymentIntent
// - recurring: Stripe Subscription (weekly) + first invoice PaymentIntent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const {
      classSessionId,
      clientEmail,
      clientFirstName,
      clientLastName,
      trackingCode,
      bookingType: rawBookingType,
      packSize: rawPackSize,
      autoRenew: rawAutoRenew,
    } = body

    const bookingType = getBookingType(rawBookingType)
    const packSize = getPackSize(rawPackSize)
    const autoRenew = rawAutoRenew === true

    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        stripeCurrency: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    if (!studio.stripeAccountId || !studio.stripeChargesEnabled) {
      return NextResponse.json(
        { error: "This studio has not set up payments yet" },
        { status: 400 }
      )
    }

    const classSession = await db.classSession.findFirst({
      where: { id: classSessionId, studioId: studio.id },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
      },
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (new Date(classSession.startTime) < new Date()) {
      return NextResponse.json({ error: "This class has already started" }, { status: 400 })
    }

    const activeBookingsCount = await db.booking.count({
      where: {
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    })

    if (activeBookingsCount >= classSession.capacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 })
    }

    let client = await db.client.findFirst({
      where: {
        email: clientEmail,
        studioId: studio.id,
      },
    })

    if (!client) {
      client = await db.client.create({
        data: {
          email: clientEmail,
          firstName: clientFirstName,
          lastName: clientLastName,
          studioId: studio.id,
        },
      })
    }

    const existingBooking = await db.booking.findFirst({
      where: {
        clientId: client.id,
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { id: true },
    })

    if (existingBooking) {
      return NextResponse.json({ error: "You have already booked this class" }, { status: 400 })
    }

    const stripe = getStripe()
    const stripeCustomerId = await ensureStripeCustomerForConnectedAccount({
      stripe,
      stripeAccountId: studio.stripeAccountId,
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        studioId: studio.id,
        stripeCustomerId: client.stripeCustomerId,
      },
    })

    const normalizedTrackingCode = normalizeSocialTrackingCode(trackingCode)
    let attributedTrackingCode: string | null = null
    if (normalizedTrackingCode) {
      const trackingLink = await db.socialMediaTrackingLink.findFirst({
        where: {
          code: normalizedTrackingCode,
          studioId: studio.id,
        },
        select: { id: true },
      })
      if (trackingLink) {
        attributedTrackingCode = normalizedTrackingCode
      }
    }

    const unitClassPriceCents = Math.round(classSession.classType.price * 100)
    const currency = studio.stripeCurrency || "usd"

    if (bookingType === "recurring") {
      const weeklyAmountCents = Math.round(classSession.classType.price * 0.85 * 100)

      const existingSubscriptions = await stripe.subscriptions.list(
        {
          customer: stripeCustomerId,
          status: "all",
          limit: 100,
        },
        {
          stripeAccount: studio.stripeAccountId,
        }
      )

      const hasMatchingActiveWeeklySubscription = existingSubscriptions.data.some((subscription) => {
        if (
          !["active", "trialing", "past_due", "unpaid", "incomplete"].includes(subscription.status)
        ) {
          return false
        }
        return (
          subscription.metadata?.type === "weekly_class_booking" &&
          subscription.metadata?.classSessionId === classSession.id
        )
      })

      if (hasMatchingActiveWeeklySubscription) {
        return NextResponse.json(
          { error: "You already have an active weekly subscription for this class" },
          { status: 400 }
        )
      }

      const startDate = new Date(classSession.startTime)
      const recurringProduct = await stripe.products.create(
        {
          name: `${classSession.classType.name} Weekly Subscription`,
          description: `Auto-books into the weekly ${classSession.classType.name} class`,
          metadata: {
            studioId: studio.id,
            classTypeId: classSession.classType.id,
          },
        },
        {
          stripeAccount: studio.stripeAccountId,
        }
      )

      const weeklySubscription = await stripe.subscriptions.create(
        {
          customer: stripeCustomerId,
          collection_method: "charge_automatically",
          payment_behavior: "default_incomplete",
          payment_settings: {
            save_default_payment_method: "on_subscription",
          },
          items: [
            {
              price_data: {
                currency,
                unit_amount: weeklyAmountCents,
                recurring: {
                  interval: "week",
                  interval_count: 1,
                },
                product: recurringProduct.id,
              },
            },
          ],
          metadata: {
            type: "weekly_class_booking",
            studioId: studio.id,
            clientId: client.id,
            classSessionId: classSession.id,
            classTypeId: classSession.classType.id,
            teacherId: classSession.teacher.id,
            locationId: classSession.location.id,
            anchorWeekdayUtc: String(startDate.getUTCDay()),
            anchorMinutesUtc: String(startDate.getUTCHours() * 60 + startDate.getUTCMinutes()),
            anchorStartTime: startDate.toISOString(),
            ...(attributedTrackingCode ? { trackingCode: attributedTrackingCode } : {}),
          },
          expand: ["latest_invoice.payment_intent", "latest_invoice"],
        },
        {
          stripeAccount: studio.stripeAccountId,
        }
      )

      const latestInvoice = weeklySubscription.latest_invoice
      const expandedInvoice = latestInvoice && typeof latestInvoice !== "string" ? latestInvoice : null
      const rawPaymentIntent = (
        expandedInvoice as (Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null }) | null
      )?.payment_intent
      const expandedPaymentIntent =
        rawPaymentIntent && typeof rawPaymentIntent !== "string" ? rawPaymentIntent : null

      if (!expandedPaymentIntent?.client_secret) {
        await stripe.subscriptions.cancel(
          weeklySubscription.id,
          {},
          { stripeAccount: studio.stripeAccountId }
        ).catch(() => {
          // Best effort cleanup for incomplete subscriptions
        })
        return NextResponse.json(
          { error: "Could not initialize weekly subscription payment. Please try again." },
          { status: 400 }
        )
      }

      const weeklySubscriptionPeriodEnd =
        (weeklySubscription as Stripe.Subscription & { current_period_end?: number }).current_period_end

      await stripe.paymentIntents.update(
        expandedPaymentIntent.id,
        {
          metadata: {
            clientId: client.id,
            studioId: studio.id,
            classSessionId: classSession.id,
            className: classSession.classType.name,
            classDate: new Date(classSession.startTime).toISOString(),
            teacherName: `${classSession.teacher.user.firstName} ${classSession.teacher.user.lastName}`,
            locationName: classSession.location.name,
            bookingType: "recurring",
            creditsPurchased: "1",
            packSize: "",
            autoRenew: "false",
            unitClassPriceCents: String(weeklyAmountCents),
            stripeSubscriptionId: weeklySubscription.id,
            nextChargeAt:
              typeof weeklySubscriptionPeriodEnd === "number"
                ? new Date(weeklySubscriptionPeriodEnd * 1000).toISOString()
                : "",
            ...(attributedTrackingCode ? { trackingCode: attributedTrackingCode } : {}),
          },
        },
        {
          stripeAccount: studio.stripeAccountId,
        }
      )

      const payment = await db.payment.create({
        data: {
          amount: weeklyAmountCents,
          currency,
          status: "PENDING",
          stripePaymentIntentId: expandedPaymentIntent.id,
          description: `${classSession.classType.name} - Weekly Subscription`,
          studioId: studio.id,
          clientId: client.id,
        },
      })

      return NextResponse.json({
        clientSecret: expandedPaymentIntent.client_secret,
        paymentIntentId: expandedPaymentIntent.id,
        paymentId: payment.id,
        connectedAccountId: studio.stripeAccountId,
        amount: weeklyAmountCents,
        currency,
        bookingType: "recurring",
        creditsPurchased: 1,
        autoRenew: false,
        subscriptionId: weeklySubscription.id,
      })
    }

    let creditsPurchased = 1
    let discountRate = 0
    if (bookingType === "pack") {
      creditsPurchased = packSize
      discountRate = packSize === 5 ? 0.1 : packSize === 10 ? 0.2 : 0.25
    }

    const totalDollars = classSession.classType.price * creditsPurchased * (1 - discountRate)
    const amountInCents = Math.round(totalDollars * 100)
    const platformFee = calculatePlatformFee(amountInCents)

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency,
        customer: stripeCustomerId,
        application_fee_amount: platformFee,
        automatic_payment_methods: {
          enabled: true,
        },
        ...(bookingType === "pack" && autoRenew ? { setup_future_usage: "off_session" as const } : {}),
        metadata: {
          clientId: client.id,
          studioId: studio.id,
          classSessionId: classSession.id,
          className: classSession.classType.name,
          classDate: new Date(classSession.startTime).toISOString(),
          teacherName: `${classSession.teacher.user.firstName} ${classSession.teacher.user.lastName}`,
          locationName: classSession.location.name,
          bookingType,
          creditsPurchased: String(creditsPurchased),
          packSize: bookingType === "pack" ? String(packSize) : "",
          autoRenew: bookingType === "pack" ? String(autoRenew) : "",
          unitClassPriceCents: String(unitClassPriceCents),
          ...(attributedTrackingCode ? { trackingCode: attributedTrackingCode } : {}),
        },
      },
      {
        stripeAccount: studio.stripeAccountId,
      }
    )

    const payment = await db.payment.create({
      data: {
        amount: amountInCents,
        currency,
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        description: `${classSession.classType.name} - ${new Date(classSession.startTime).toLocaleDateString()}`,
        studioId: studio.id,
        clientId: client.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      connectedAccountId: studio.stripeAccountId,
      amount: amountInCents,
      currency,
      bookingType,
      creditsPurchased,
      autoRenew: bookingType === "pack" ? autoRenew : false,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}

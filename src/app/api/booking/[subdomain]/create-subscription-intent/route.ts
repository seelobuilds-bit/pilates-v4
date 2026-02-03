import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe, calculatePlatformFee } from "@/lib/stripe"
import { verifyClientToken } from "@/lib/client-auth"

// POST - Create a PaymentIntent for subscription payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { planId, interval } = body

    // Get studio
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
      return NextResponse.json({ 
        error: "This studio has not set up payments yet" 
      }, { status: 400 })
    }

    // Authenticate client
    const decoded = await verifyClientToken(subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const client = await db.client.findUnique({
      where: { id: decoded.clientId },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get plan
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    // Check if already subscribed
    const existingSubscription = await db.vaultSubscriber.findFirst({
      where: {
        clientId: client.id,
        planId: plan.id,
        status: "active"
      }
    })

    if (existingSubscription) {
      return NextResponse.json({ error: "Already subscribed to this plan" }, { status: 400 })
    }

    const stripe = getStripe()

    // Create or get Stripe customer on the connected account
    let stripeCustomerId = client.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: `${client.firstName} ${client.lastName}`,
        metadata: {
          clientId: client.id,
          studioId: studio.id,
        },
      }, {
        stripeAccount: studio.stripeAccountId,
      })

      stripeCustomerId = customer.id

      await db.client.update({
        where: { id: client.id },
        data: { stripeCustomerId },
      })
    }

    // Calculate amount based on interval
    const price = interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
    if (!price) {
      return NextResponse.json({ error: "Plan price not configured" }, { status: 400 })
    }
    const amountInCents = Math.round(price * 100)
    const platformFee = calculatePlatformFee(amountInCents)

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: studio.stripeCurrency || "usd",
      customer: stripeCustomerId,
      application_fee_amount: platformFee,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        clientId: client.id,
        studioId: studio.id,
        planId: plan.id,
        planName: plan.name,
        interval,
        type: "vault_subscription",
      },
    }, {
      stripeAccount: studio.stripeAccountId,
    })

    // Create pending payment record
    const payment = await db.payment.create({
      data: {
        amount: amountInCents,
        currency: studio.stripeCurrency || "usd",
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        description: `${plan.name} - ${interval === "yearly" ? "Annual" : "Monthly"} Subscription`,
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
      currency: studio.stripeCurrency || "usd",
    })
  } catch (error) {
    console.error("Error creating subscription payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}














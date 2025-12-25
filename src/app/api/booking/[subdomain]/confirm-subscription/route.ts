import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { getStripe } from "@/lib/stripe"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

// POST - Confirm subscription payment and create subscription
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

    // Authenticate client
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${studio.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
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

    // Get subscription details from metadata
    const planId = paymentIntent.metadata.planId
    const clientId = paymentIntent.metadata.clientId
    const interval = paymentIntent.metadata.interval as "monthly" | "yearly"

    if (!planId || !clientId) {
      return NextResponse.json({ error: "Missing subscription information" }, { status: 400 })
    }

    // Check for existing subscription (idempotency)
    const existingSubscription = await db.vaultSubscriber.findFirst({
      where: {
        clientId,
        planId,
        status: "active",
      },
    })

    if (existingSubscription) {
      // Already subscribed, return the existing subscription
      return NextResponse.json({
        success: true,
        subscription: existingSubscription,
      })
    }

    // Get the plan
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: { communityChat: true }
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Calculate period dates
    const now = new Date()
    const periodEnd = new Date(now)
    if (interval === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    // Create subscription
    const subscription = await db.vaultSubscriber.create({
      data: {
        clientId,
        planId,
        interval,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paidAmount: payment.amount / 100,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            audience: true,
          }
        }
      }
    })

    // Add to community chat if enabled
    if (plan.communityChat?.isEnabled) {
      await db.vaultSubscriptionChatMember.create({
        data: {
          chatId: plan.communityChat.id,
          subscriberId: subscription.id,
          role: "member"
        }
      })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planName: subscription.plan.name,
        interval: subscription.interval,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    })
  } catch (error) {
    console.error("Error confirming subscription:", error)
    return NextResponse.json({ error: "Failed to confirm subscription" }, { status: 500 })
  }
}

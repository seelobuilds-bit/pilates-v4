import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"
import { getStripe } from "@/lib/stripe"

// POST - Resume subscription auto-renew before current period ends
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        stripeAccountId: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const subscription = await db.vaultSubscriber.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          select: {
            studioId: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    if (subscription.clientId !== decoded.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (subscription.plan.studioId !== studio.id) {
      return NextResponse.json({ error: "Subscription does not belong to this studio" }, { status: 403 })
    }

    if (subscription.status === "active") {
      return NextResponse.json({
        success: true,
        message: "Subscription is already active.",
      })
    }

    if (subscription.status !== "cancelled") {
      return NextResponse.json({ error: "Only cancelled subscriptions can be resumed" }, { status: 400 })
    }

    if (new Date(subscription.currentPeriodEnd) <= new Date()) {
      return NextResponse.json(
        { error: "Subscription period already ended. Please purchase a new subscription." },
        { status: 400 }
      )
    }

    if (subscription.stripeSubscriptionId && studio.stripeAccountId) {
      const stripe = getStripe()
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: false },
        { stripeAccount: studio.stripeAccountId }
      )
    }

    await db.vaultSubscriber.update({
      where: { id: subscription.id },
      data: {
        status: "active",
        cancelledAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Subscription auto-renew has been resumed.",
    })
  } catch (error) {
    console.error("Error resuming subscription:", error)
    return NextResponse.json({ error: "Failed to resume subscription" }, { status: 500 })
  }
}

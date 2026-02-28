import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientTokenFromRequest } from "@/lib/client-auth"
import { cancelClientBookingPlan } from "@/lib/client-booking-plans"
import { getStripe } from "@/lib/stripe"

// POST - Cancel a subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId : ""
    const bookingPlanId = typeof body?.bookingPlanId === "string" ? body.bookingPlanId : ""
    if (!subscriptionId && !bookingPlanId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    // Get studio
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

    // Authenticate client
    const decoded = await verifyClientTokenFromRequest(request, subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (bookingPlanId) {
      const result = await cancelClientBookingPlan({
        planId: bookingPlanId,
        clientId: decoded.clientId,
        studioId: studio.id,
      })

      if (!result.ok) {
        return NextResponse.json({ error: "Booking plan not found" }, { status: 404 })
      }

      if (result.alreadyCancelled) {
        return NextResponse.json({
          success: true,
          message: result.message,
          accessUntil: result.accessUntil,
        })
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        accessUntil: result.accessUntil,
      })
    }

    // Get the subscription
    const subscription = await db.vaultSubscriber.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          select: {
            studioId: true,
            communityChat: {
              select: { id: true },
            },
          },
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Verify the subscription belongs to this client
    if (subscription.clientId !== decoded.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (subscription.plan.studioId !== studio.id) {
      return NextResponse.json({ error: "Subscription does not belong to this studio" }, { status: 403 })
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "Subscription is already scheduled to cancel at period end.",
        accessUntil: subscription.currentPeriodEnd,
      })
    }

    if (subscription.status !== "active") {
      return NextResponse.json({ error: "Only active subscriptions can be cancelled" }, { status: 400 })
    }

    if (subscription.stripeSubscriptionId && studio.stripeAccountId) {
      const stripe = getStripe()
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true },
        { stripeAccount: studio.stripeAccountId }
      )
    }

    // Mark cancellation scheduled while preserving access until currentPeriodEnd.
    await db.vaultSubscriber.update({
      where: { id: subscriptionId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Subscription will cancel at the end of your current billing period.",
      accessUntil: subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}









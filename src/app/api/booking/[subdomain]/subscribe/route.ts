import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  try {
    const studio = await db.studio.findUnique({
      where: { subdomain }
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

    const client = await db.client.findUnique({
      where: { id: decoded.clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const body = await request.json()
    const { planId, interval } = body

    if (!planId || !interval) {
      return NextResponse.json({ error: "Plan ID and interval required" }, { status: 400 })
    }

    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 })
    }

    // Get the plan
    const plan = await db.vaultSubscriptionPlan.findFirst({
      where: { id: planId, studioId: studio.id },
      include: { communityChat: true }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    if (client.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid client scope" }, { status: 400 })
    }

    const planPrice = interval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
    if (planPrice === null) {
      return NextResponse.json({ error: "Selected interval is not available for this plan" }, { status: 400 })
    }

    if (planPrice > 0) {
      return NextResponse.json(
        { error: "Paid plans require payment confirmation. Use create-subscription-intent." },
        { status: 400 }
      )
    }

    // Check if client already has an active subscription to this plan
    const now = new Date()
    const existingSubscription = await db.vaultSubscriber.findFirst({
      where: {
        clientId: client.id,
        planId: plan.id,
        OR: [
          { status: "active" },
          { status: "cancelled", currentPeriodEnd: { gt: now } },
        ],
      }
    })

    if (existingSubscription) {
      return NextResponse.json({ error: "Already subscribed or cancellation is pending for this plan" }, { status: 400 })
    }

    // Calculate period dates
    const periodEnd = new Date(now)
    if (interval === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else if (interval === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    // Create subscription
    const subscription = await db.vaultSubscriber.create({
      data: {
        clientId: client.id,
        planId: plan.id,
        interval,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paidAmount: 0,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            audience: true,
            monthlyPrice: true,
            features: true
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

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Failed to subscribe:", error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}












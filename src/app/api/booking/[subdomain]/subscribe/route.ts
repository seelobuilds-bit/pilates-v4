import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

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

    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

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

    // Get the plan
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: { communityChat: true }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    // Check if client already has an active subscription to this plan
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

    // Calculate period dates
    const now = new Date()
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
        currentPeriodEnd: periodEnd
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














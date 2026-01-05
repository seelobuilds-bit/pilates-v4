import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

// POST - Cancel a subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { subscriptionId } = body

    // Get studio
    const studio = await db.studio.findUnique({
      where: { subdomain },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Authenticate client
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get the subscription
    const subscription = await db.vaultSubscriber.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          include: { communityChat: true }
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

    // Update subscription status to cancelled
    await db.vaultSubscriber.update({
      where: { id: subscriptionId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    })

    // Remove from community chat if they were a member
    if (subscription.plan.communityChat?.id) {
      await db.vaultSubscriptionChatMember.deleteMany({
        where: {
          chatId: subscription.plan.communityChat.id,
          subscriberId: subscriptionId,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully. You will retain access until the end of your billing period.",
      accessUntil: subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}












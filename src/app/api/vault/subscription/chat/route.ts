import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch chat messages for a subscription tier
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  
  const planId = searchParams.get("planId")
  const before = searchParams.get("before")
  const limit = parseInt(searchParams.get("limit") || "50")

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!planId) {
    return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
  }

  try {
    // Get the subscription plan and chat
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        communityChat: true
      }
    })

    if (!plan || !plan.communityChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Check if user is a subscriber
    const subscriptionConditions = []
    if (session.user.teacherId) {
      subscriptionConditions.push({ teacherId: session.user.teacherId })
    }
    subscriptionConditions.push({ userId: session.user.id })

    const subscription = await db.vaultSubscriber.findFirst({
      where: {
        planId,
        status: "active",
        OR: subscriptionConditions
      },
      include: {
        chatMembership: true
      }
    })

    // Also allow studio owner to view
    const isStudioOwner = session.user.studioId === plan.studioId

    if (!subscription && !isStudioOwner) {
      return NextResponse.json({ error: "Not subscribed to this plan" }, { status: 403 })
    }

    // Build query for messages
    const whereMessages: Record<string, unknown> = {
      chatId: plan.communityChat.id,
      isDeleted: false
    }

    if (before) {
      whereMessages.createdAt = { lt: new Date(before) }
    }

    // Fetch messages
    const messages = await db.vaultSubscriptionChatMessage.findMany({
      where: whereMessages,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        member: {
          include: {
            subscriber: {
              include: {
                teacher: {
                  include: {
                    user: { select: { firstName: true, lastName: true } }
                  }
                },
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      }
    })

    // Get member count
    const memberCount = await db.vaultSubscriptionChatMember.count({
      where: { chatId: plan.communityChat.id }
    })

    // Update last read if member exists
    if (subscription?.chatMembership) {
      await db.vaultSubscriptionChatMember.update({
        where: { id: subscription.chatMembership.id },
        data: { lastReadAt: new Date() }
      })
    }

    return NextResponse.json({
      chat: {
        id: plan.communityChat.id,
        name: plan.communityChat.name,
        isEnabled: plan.communityChat.isEnabled,
        planName: plan.name,
        audience: plan.audience
      },
      messages: messages.reverse(),
      memberCount,
      membership: subscription?.chatMembership || null,
      isStudioOwner,
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error("Failed to fetch subscription chat:", error)
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}

// POST - Send a message in subscription chat
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { planId, content, type } = body

    // Get the plan and chat
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: { communityChat: true }
    })

    if (!plan || !plan.communityChat || !plan.communityChat.isEnabled) {
      return NextResponse.json({ error: "Chat not available" }, { status: 400 })
    }

    // Check subscription
    const subscriptionConditions = []
    if (session.user.teacherId) {
      subscriptionConditions.push({ teacherId: session.user.teacherId })
    }
    subscriptionConditions.push({ userId: session.user.id })

    const subscription = await db.vaultSubscriber.findFirst({
      where: {
        planId,
        status: "active",
        OR: subscriptionConditions
      },
      include: { chatMembership: true }
    })

    if (!subscription || !subscription.chatMembership) {
      // Studio owner can also post
      if (session.user.studioId !== plan.studioId) {
        return NextResponse.json({ error: "Not subscribed" }, { status: 403 })
      }
      
      // For studio owner without subscription, we'd need special handling
      // For now, require subscription
      return NextResponse.json({ error: "Subscription required to post" }, { status: 403 })
    }

    if (subscription.chatMembership.isBanned) {
      return NextResponse.json({ error: "You are banned from this chat" }, { status: 403 })
    }

    if (subscription.chatMembership.isMuted) {
      return NextResponse.json({ error: "You are muted" }, { status: 403 })
    }

    // Create message
    const message = await db.vaultSubscriptionChatMessage.create({
      data: {
        chatId: plan.communityChat.id,
        memberId: subscription.chatMembership.id,
        content,
        type: type || "text"
      },
      include: {
        member: {
          include: {
            subscriber: {
              include: {
                teacher: {
                  include: {
                    user: { select: { firstName: true, lastName: true } }
                  }
                },
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

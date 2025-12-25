import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// Helper to ensure teacher/admin has access to community chats
async function ensureTeacherAccess(
  session: { user: { id: string; teacherId?: string; studioId?: string; role?: string } },
  plan: { id: string; audience: string; studioId: string; communityChat: { id: string } | null }
) {
  if (!plan.communityChat) return null

  const isTeacher = !!session.user.teacherId
  const isStudioAdmin = session.user.studioId === plan.studioId && 
    (session.user.role === "OWNER" || session.user.role === "ADMIN")

  // Teachers get access to TEACHERS and CLIENTS communities
  // Studio admins get access to all communities
  const hasAutoAccess = 
    (isTeacher && (plan.audience === "TEACHERS" || plan.audience === "CLIENTS")) ||
    isStudioAdmin

  if (!hasAutoAccess) return null

  // Check if subscription exists
  const existingSubscription = await db.vaultSubscriber.findFirst({
    where: {
      planId: plan.id,
      OR: [
        ...(session.user.teacherId ? [{ teacherId: session.user.teacherId }] : []),
        { userId: session.user.id }
      ]
    },
    include: { chatMembership: true }
  })

  if (existingSubscription?.chatMembership) {
    return existingSubscription
  }

  // Create auto-subscription for teachers/admins
  const subscriptionData: Record<string, unknown> = {
    planId: plan.id,
    interval: "yearly",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: "active",
    cancelAtPeriodEnd: false
  }

  if (session.user.teacherId) {
    subscriptionData.teacherId = session.user.teacherId
  } else {
    subscriptionData.userId = session.user.id
  }

  // Create or update subscription
  let subscription
  if (existingSubscription) {
    subscription = await db.vaultSubscriber.update({
      where: { id: existingSubscription.id },
      data: { status: "active" },
      include: { chatMembership: true }
    })
  } else {
    subscription = await db.vaultSubscriber.create({
      data: subscriptionData as never,
      include: { chatMembership: true }
    })
  }

  // Create chat membership if needed
  if (!subscription.chatMembership) {
    await db.vaultSubscriptionChatMember.create({
      data: {
        chatId: plan.communityChat.id,
        subscriberId: subscription.id,
        role: isStudioAdmin ? "admin" : (isTeacher ? "moderator" : "member")
      }
    })

    // Re-fetch with membership
    subscription = await db.vaultSubscriber.findUnique({
      where: { id: subscription.id },
      include: { chatMembership: true }
    })
  }

  return subscription
}

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

    let subscription = await db.vaultSubscriber.findFirst({
      where: {
        planId,
        status: "active",
        OR: subscriptionConditions
      },
      include: {
        chatMembership: true
      }
    })

    // Also allow studio owner/admin to view
    const isStudioOwner = session.user.studioId === plan.studioId

    // Auto-subscribe teachers/admins if they have access
    if (!subscription) {
      subscription = await ensureTeacherAccess(session as never, plan as never)
    }

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

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
    }

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

    let subscription = await db.vaultSubscriber.findFirst({
      where: {
        planId,
        status: "active",
        OR: subscriptionConditions
      },
      include: { chatMembership: true }
    })

    // Auto-subscribe teachers/admins if they have access
    if (!subscription || !subscription.chatMembership) {
      subscription = await ensureTeacherAccess(session as never, plan as never)
    }

    if (!subscription || !subscription.chatMembership) {
      // Final check for studio owner without subscription
      if (session.user.studioId !== plan.studioId) {
        return NextResponse.json({ error: "Not subscribed" }, { status: 403 })
      }
      return NextResponse.json({ error: "Could not establish chat membership" }, { status: 403 })
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
        content: content.trim(),
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

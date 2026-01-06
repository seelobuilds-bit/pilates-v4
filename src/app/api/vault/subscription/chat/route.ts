import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// Helper to ensure teacher/admin has access to community chats
async function ensureTeacherAccess(
  session: { user: { id: string; teacherId?: string; studioId?: string; role?: string } },
  plan: { id: string; audience: string; studioId: string; communityChat: { id: string } | null }
) {
  if (!plan.communityChat) {
    console.log("[ensureTeacherAccess] No community chat for plan")
    return null
  }

  const isTeacher = !!session.user.teacherId
  const isStudioAdmin = session.user.studioId === plan.studioId && 
    (session.user.role === "OWNER" || session.user.role === "ADMIN")

  // Check if user belongs to the same studio as the plan
  const isSameStudio = session.user.studioId === plan.studioId

  console.log("[ensureTeacherAccess] isTeacher:", isTeacher, "isStudioAdmin:", isStudioAdmin, "isSameStudio:", isSameStudio)
  console.log("[ensureTeacherAccess] User studioId:", session.user.studioId, "Plan studioId:", plan.studioId)
  console.log("[ensureTeacherAccess] Plan audience:", plan.audience)

  // Teachers get access to TEACHERS and CLIENTS communities (from their studio)
  // Studio admins get access to all communities
  const hasAutoAccess = 
    (isTeacher && isSameStudio && (plan.audience === "TEACHERS" || plan.audience === "CLIENTS")) ||
    isStudioAdmin

  if (!hasAutoAccess) {
    console.log("[ensureTeacherAccess] No auto access")
    return null
  }

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

  console.log("[ensureTeacherAccess] Existing subscription:", !!existingSubscription, "Has membership:", !!existingSubscription?.chatMembership)

  if (existingSubscription?.chatMembership) {
    return existingSubscription
  }

  // Create auto-subscription for teachers/admins
  const subscriptionData: Record<string, unknown> = {
    planId: plan.id,
    interval: "yearly",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: "active"
  }

  if (session.user.teacherId) {
    subscriptionData.teacherId = session.user.teacherId
  } else {
    subscriptionData.userId = session.user.id
  }

  console.log("[ensureTeacherAccess] Creating subscription with:", subscriptionData)

  // Create or update subscription
  let subscription
  try {
    if (existingSubscription) {
      subscription = await db.vaultSubscriber.update({
        where: { id: existingSubscription.id },
        data: { status: "active" },
        include: { chatMembership: true }
      })
      console.log("[ensureTeacherAccess] Updated existing subscription")
    } else {
      subscription = await db.vaultSubscriber.create({
        data: subscriptionData as never,
        include: { chatMembership: true }
      })
      console.log("[ensureTeacherAccess] Created new subscription:", subscription.id)
    }
  } catch (createErr) {
    console.error("[ensureTeacherAccess] Failed to create/update subscription:", createErr)
    return null
  }

  // Create chat membership if needed
  if (!subscription.chatMembership) {
    try {
      console.log("[ensureTeacherAccess] Creating chat membership for subscriberId:", subscription.id)
      await db.vaultSubscriptionChatMember.create({
        data: {
          chatId: plan.communityChat.id,
          subscriberId: subscription.id,
          role: isStudioAdmin ? "admin" : (isTeacher ? "moderator" : "member")
        }
      })
      console.log("[ensureTeacherAccess] Chat membership created")

      // Re-fetch with membership
      subscription = await db.vaultSubscriber.findUnique({
        where: { id: subscription.id },
        include: { chatMembership: true }
      })
      console.log("[ensureTeacherAccess] Re-fetched subscription with membership:", !!subscription?.chatMembership)
    } catch (memberErr) {
      console.error("[ensureTeacherAccess] Failed to create chat membership:", memberErr)
      return null
    }
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
    console.log("[Chat POST] No session")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[Chat POST] User:", session.user.id, "teacherId:", session.user.teacherId, "studioId:", session.user.studioId)

  try {
    const body = await request.json()
    const { planId, content, type } = body

    console.log("[Chat POST] planId:", planId, "content length:", content?.length)

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
    }

    // Get the plan and chat
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: { communityChat: true }
    })

    console.log("[Chat POST] Plan found:", !!plan, "Chat:", !!plan?.communityChat, "Enabled:", plan?.communityChat?.isEnabled)

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

    console.log("[Chat POST] Existing subscription:", !!subscription, "Has membership:", !!subscription?.chatMembership)

    // Auto-subscribe teachers/admins if they have access
    if (!subscription || !subscription.chatMembership) {
      console.log("[Chat POST] Attempting auto-subscribe...")
      subscription = await ensureTeacherAccess(session as never, plan as never)
      console.log("[Chat POST] Auto-subscribe result:", !!subscription, "Has membership:", !!subscription?.chatMembership)
    }

    if (!subscription || !subscription.chatMembership) {
      // Final check for studio owner without subscription
      console.log("[Chat POST] No subscription. User studioId:", session.user.studioId, "Plan studioId:", plan.studioId)
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
    console.log("[Chat POST] Creating message with memberId:", subscription.chatMembership.id)
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

    console.log("[Chat POST] Message created:", message.id)
    return NextResponse.json(message)
  } catch (error) {
    console.error("[Chat POST] Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}













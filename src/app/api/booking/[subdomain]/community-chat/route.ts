import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"

// GET - Fetch community chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get("planId")

  if (!planId) {
    return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
  }

  try {
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Authenticate client
    const decoded = await verifyClientToken(subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if client has active subscription to this plan
    const subscription = await db.vaultSubscriber.findFirst({
      where: {
        clientId: decoded.clientId,
        planId,
        status: "active"
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription to this plan" }, { status: 403 })
    }

    // Get the plan and chat
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        communityChat: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 100,
              include: {
                member: {
                  include: {
                    subscriber: {
                      include: {
                        client: { select: { firstName: true, lastName: true } },
                        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
                        user: { select: { firstName: true, lastName: true } }
                      }
                    }
                  }
                }
              }
            },
            _count: { select: { members: true } }
          }
        }
      }
    })

    if (!plan?.communityChat?.isEnabled) {
      return NextResponse.json({ error: "Community chat not enabled" }, { status: 404 })
    }

    return NextResponse.json({
      chat: {
        id: plan.communityChat.id,
        isEnabled: plan.communityChat.isEnabled
      },
      messages: plan.communityChat.messages,
      memberCount: plan.communityChat._count.members
    })
  } catch (error) {
    console.error("Failed to fetch community chat:", error)
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}

// POST - Send a message to community chat
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

    // Authenticate client
    const decoded = await verifyClientToken(subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, content, type = "text" } = body

    if (!planId || !content) {
      return NextResponse.json({ error: "Plan ID and content required" }, { status: 400 })
    }

    // Check if client has active subscription to this plan
    const subscription = await db.vaultSubscriber.findFirst({
      where: {
        clientId: decoded.clientId,
        planId,
        status: "active"
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription to this plan" }, { status: 403 })
    }

    // Get the plan and chat
    const plan = await db.vaultSubscriptionPlan.findUnique({
      where: { id: planId },
      include: { communityChat: true }
    })

    if (!plan?.communityChat?.isEnabled) {
      return NextResponse.json({ error: "Community chat not enabled" }, { status: 404 })
    }

    // Get or create chat membership
    let membership = await db.vaultSubscriptionChatMember.findFirst({
      where: {
        chatId: plan.communityChat.id,
        subscriberId: subscription.id
      }
    })

    if (!membership) {
      membership = await db.vaultSubscriptionChatMember.create({
        data: {
          chatId: plan.communityChat.id,
          subscriberId: subscription.id,
          role: "member"
        }
      })
    }

    // Create the message
    const message = await db.vaultSubscriptionChatMessage.create({
      data: {
        chatId: plan.communityChat.id,
        memberId: membership.id,
        content,
        type
      },
      include: {
        member: {
          include: {
            subscriber: {
              include: {
                client: { select: { firstName: true, lastName: true } },
                teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
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














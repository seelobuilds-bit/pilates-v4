import { VaultAudience } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, type MobileTokenPayload, verifyMobileToken } from "@/lib/mobile-auth"

type AccessiblePlan = {
  id: string
  name: string
  audience: VaultAudience
  studioId: string
  communityChat: {
    id: string
    name: string | null
    isEnabled: boolean
  } | null
}

const TEACHER_ALLOWED_AUDIENCES: VaultAudience[] = ["TEACHERS", "CLIENTS"]

async function resolveStudio(decoded: MobileTokenPayload) {
  const studio = await db.studio.findUnique({
    where: { id: decoded.studioId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      primaryColor: true,
      stripeCurrency: true,
    },
  })

  if (!studio || studio.subdomain !== decoded.studioSubdomain) {
    return null
  }

  return {
    id: studio.id,
    name: studio.name,
    subdomain: studio.subdomain,
    primaryColor: studio.primaryColor,
    currency: studio.stripeCurrency,
  }
}

async function getAccessiblePlans(decoded: MobileTokenPayload): Promise<AccessiblePlan[]> {
  return db.vaultSubscriptionPlan.findMany({
    where: {
      studioId: decoded.studioId,
      isActive: true,
      communityChat: { is: { isEnabled: true } },
      ...(decoded.role === "TEACHER" ? { audience: { in: TEACHER_ALLOWED_AUDIENCES } } : {}),
    },
    select: {
      id: true,
      name: true,
      audience: true,
      studioId: true,
      communityChat: {
        select: {
          id: true,
          name: true,
          isEnabled: true,
        },
      },
    },
    orderBy: [{ audience: "asc" }, { createdAt: "asc" }],
  })
}

async function ensureChatMembership(decoded: MobileTokenPayload, plan: AccessiblePlan) {
  if (!plan.communityChat) {
    return null
  }

  const subscriberWhere = {
    planId: plan.id,
    OR: [{ userId: decoded.sub }, ...(decoded.teacherId ? [{ teacherId: decoded.teacherId }] : [])],
  }

  let subscriber = await db.vaultSubscriber.findFirst({
    where: subscriberWhere,
    include: {
      chatMembership: true,
    },
  })

  if (!subscriber) {
    subscriber = await db.vaultSubscriber.create({
      data: {
        planId: plan.id,
        interval: "yearly",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        userId: decoded.sub,
        ...(decoded.teacherId ? { teacherId: decoded.teacherId } : {}),
      },
      include: {
        chatMembership: true,
      },
    })
  }

  if (subscriber.status !== "active") {
    subscriber = await db.vaultSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "active" },
      include: {
        chatMembership: true,
      },
    })
  }

  if (!subscriber.chatMembership) {
    await db.vaultSubscriptionChatMember.create({
      data: {
        chatId: plan.communityChat.id,
        subscriberId: subscriber.id,
        role: decoded.role === "OWNER" ? "admin" : "moderator",
      },
    })

    subscriber = await db.vaultSubscriber.findUnique({
      where: { id: subscriber.id },
      include: {
        chatMembership: true,
      },
    })
  }

  return subscriber?.chatMembership || null
}

function messageSenderName(message: {
  member: {
    role: string
    subscriber: {
      teacher: { user: { firstName: string; lastName: string } } | null
      user: { firstName: string; lastName: string } | null
    }
  }
}) {
  const teacherName = message.member.subscriber.teacher?.user
  if (teacherName) {
    return `${teacherName.firstName} ${teacherName.lastName}`.trim()
  }

  const userName = message.member.subscriber.user
  if (userName) {
    return `${userName.firstName} ${userName.lastName}`.trim()
  }

  return "Member"
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "OWNER" && decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Community is available for studio and teacher accounts only" }, { status: 403 })
    }

    const studio = await resolveStudio(decoded)
    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const plans = await getAccessiblePlans(decoded)
    if (plans.length === 0) {
      return NextResponse.json({
        role: decoded.role,
        studio,
        plans: [],
        activePlanId: null,
        chat: null,
        messages: [],
      })
    }

    const requestedPlanId = String(request.nextUrl.searchParams.get("planId") || "")
    const activePlan = plans.find((plan) => plan.id === requestedPlanId) || plans[0]

    if (!activePlan.communityChat) {
      return NextResponse.json({
        role: decoded.role,
        studio,
        plans: plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          audience: plan.audience,
          chatId: plan.communityChat?.id || null,
          isEnabled: !!plan.communityChat?.isEnabled,
          memberCount: 0,
        })),
        activePlanId: activePlan.id,
        chat: null,
        messages: [],
      })
    }

    const membership = await ensureChatMembership(decoded, activePlan)

    const [memberCounts, messages] = await Promise.all([
      db.vaultSubscriptionChatMember.groupBy({
        by: ["chatId"],
        where: {
          chatId: { in: plans.map((plan) => plan.communityChat?.id).filter((id): id is string => Boolean(id)) },
          isBanned: false,
        },
        _count: {
          _all: true,
        },
      }),
      db.vaultSubscriptionChatMessage.findMany({
        where: {
          chatId: activePlan.communityChat.id,
          isDeleted: false,
        },
        include: {
          member: {
            include: {
              subscriber: {
                include: {
                  teacher: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const memberCountByChat = new Map(memberCounts.map((item) => [item.chatId, item._count._all]))

    if (membership) {
      await db.vaultSubscriptionChatMember.update({
        where: { id: membership.id },
        data: { lastReadAt: new Date() },
      })
    }

    return NextResponse.json({
      role: decoded.role,
      studio,
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        audience: plan.audience,
        chatId: plan.communityChat?.id || null,
        isEnabled: !!plan.communityChat?.isEnabled,
        memberCount: plan.communityChat ? memberCountByChat.get(plan.communityChat.id) || 0 : 0,
      })),
      activePlanId: activePlan.id,
      chat: {
        id: activePlan.communityChat.id,
        name: activePlan.communityChat.name || `${activePlan.name} Community`,
        audience: activePlan.audience,
        memberCount: memberCountByChat.get(activePlan.communityChat.id) || 0,
      },
      messages: messages.reverse().map((message) => ({
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        senderName: messageSenderName(message),
        senderRole: message.member.role,
        isMine: membership ? message.memberId === membership.id : false,
      })),
    })
  } catch (error) {
    console.error("Mobile community error:", error)
    return NextResponse.json({ error: "Failed to load community" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "OWNER" && decoded.role !== "TEACHER") {
      return NextResponse.json({ error: "Community is available for studio and teacher accounts only" }, { status: 403 })
    }

    const studio = await resolveStudio(decoded)
    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json()
    const planId = String(body?.planId || "")
    const content = String(body?.content || "").trim()

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const plans = await getAccessiblePlans(decoded)
    const activePlan = plans.find((plan) => plan.id === planId)
    if (!activePlan || !activePlan.communityChat) {
      return NextResponse.json({ error: "Community plan not found" }, { status: 404 })
    }

    const membership = await ensureChatMembership(decoded, activePlan)
    if (!membership) {
      return NextResponse.json({ error: "Unable to join community" }, { status: 403 })
    }

    if (membership.isBanned) {
      return NextResponse.json({ error: "You are banned from this community" }, { status: 403 })
    }

    if (membership.isMuted) {
      return NextResponse.json({ error: "You are muted in this community" }, { status: 403 })
    }

    const message = await db.vaultSubscriptionChatMessage.create({
      data: {
        chatId: activePlan.communityChat.id,
        memberId: membership.id,
        content,
        type: "text",
      },
      include: {
        member: {
          include: {
            subscriber: {
              include: {
                teacher: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        senderName: messageSenderName(message),
        senderRole: message.member.role,
        isMine: true,
      },
    })
  } catch (error) {
    console.error("Mobile community send error:", error)
    return NextResponse.json({ error: "Failed to send community message" }, { status: 500 })
  }
}

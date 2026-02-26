import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

function buildAccountScope(user: { studioId: string; teacherId?: string | null }) {
  if (user.teacherId) {
    return {
      OR: [
        { studioId: user.studioId },
        { teacherId: user.teacherId },
      ],
    }
  }

  return {
    OR: [
      { studioId: user.studioId },
      { teacher: { studioId: user.studioId } },
    ],
  }
}

const publicAccountSelect = {
  id: true,
  platform: true,
  platformUserId: true,
  username: true,
  displayName: true,
  profilePicture: true,
  followerCount: true,
  followingCount: true,
  postsCount: true,
  isActive: true,
  lastSyncedAt: true,
  createdAt: true,
  studioId: true,
  teacherId: true,
  _count: {
    select: {
      flows: true,
      messages: true,
    },
  },
} as const

const publicFlowAccountSelect = {
  id: true,
  platform: true,
  username: true,
  displayName: true,
  profilePicture: true,
  followerCount: true,
  isActive: true,
  studioId: true,
  teacherId: true,
} as const

function serializeAccountOwnerType<T extends { teacherId: string | null }>(item: T) {
  return {
    ...item,
    ownerType: item.teacherId ? "TEACHER" : "STUDIO",
  }
}

// GET - Fetch social media flows
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get accounts for this studio/teacher
    const accounts = await db.socialMediaAccount.findMany({
      where: {
        ...buildAccountScope({
          studioId: session.user.studioId,
          teacherId: session.user.teacherId,
        }),
        isActive: true
      },
      select: publicAccountSelect,
    })

    const accountIds = accounts.map(a => a.id)

    const flows = await db.socialMediaFlow.findMany({
      where: {
        accountId: { in: accountIds }
      },
      include: {
        account: {
          select: publicFlowAccountSelect,
        },
        trackingLinks: true,
        _count: {
          select: { events: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      accounts: accounts.map(serializeAccountOwnerType),
      flows: flows.map((flow) => ({
        ...flow,
        account: serializeAccountOwnerType(flow.account),
      })),
    })
  } catch (error) {
    console.error("Failed to fetch flows:", error)
    return NextResponse.json({ error: "Failed to fetch flows" }, { status: 500 })
  }
}

// POST - Create new flow
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      accountId,
      name,
      description,
      triggerType,
      triggerKeywords,
      responseMessage,
      followUpMessages,
      includeBookingLink,
      bookingMessage,
      postId,
      postUrl
    } = body

    // Verify account belongs to user
    const account = await db.socialMediaAccount.findFirst({
      where: {
        id: accountId,
        ...buildAccountScope({
          studioId: session.user.studioId,
          teacherId: session.user.teacherId,
        }),
      },
      select: {
        id: true,
        platform: true,
      },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const flow = await db.socialMediaFlow.create({
      data: {
        accountId,
        name,
        description,
        triggerType,
        triggerKeywords: triggerKeywords || [],
        responseMessage,
        followUpMessages: followUpMessages ? JSON.stringify(followUpMessages) : null,
        includeBookingLink: includeBookingLink !== false,
        bookingMessage,
        postId,
        postUrl
      },
      include: {
        account: {
          select: publicFlowAccountSelect,
        },
      },
    })

    // Create tracking link for this flow
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId }
    })

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const code = `flow_${flow.id.slice(-8)}_${Date.now().toString(36)}`
    
    const params = new URLSearchParams({
      utm_source: account.platform.toLowerCase(),
      utm_medium: triggerType.toLowerCase(),
      utm_campaign: name.toLowerCase().replace(/\s+/g, "_"),
      sf_track: code
    })

    await db.socialMediaTrackingLink.create({
      data: {
        code,
        campaign: name,
        source: account.platform.toLowerCase(),
        medium: triggerType.toLowerCase(),
        destinationUrl: `${baseUrl}/${studio?.subdomain}`,
        fullTrackingUrl: `${baseUrl}/${studio?.subdomain}?${params.toString()}`,
        flowId: flow.id,
        accountId: account.id,
        studioId: session.user.studioId,
        teacherId: session.user.teacherId
      }
    })

    return NextResponse.json({
      ...flow,
      account: serializeAccountOwnerType(flow.account),
    })
  } catch (error) {
    console.error("Failed to create flow:", error)
    return NextResponse.json({ error: "Failed to create flow" }, { status: 500 })
  }
}














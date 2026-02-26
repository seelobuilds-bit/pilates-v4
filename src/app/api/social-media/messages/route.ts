import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getSocialMediaMode } from "@/lib/social-media-mode"

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
  isActive: true,
  lastSyncedAt: true,
  studioId: true,
  teacherId: true,
  _count: {
    select: {
      flows: true,
      messages: true,
    },
  },
} as const

function serializeAccountOwnerType<T extends { teacherId: string | null }>(account: T) {
  return {
    ...account,
    ownerType: account.teacherId ? "TEACHER" : "STUDIO",
  }
}

// GET - Fetch social media conversations/messages
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const accountId = searchParams.get("accountId")
  const platformUserId = searchParams.get("platformUserId") // For specific conversation

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

    const accessibleAccountIds = new Set(accounts.map((account) => account.id))
    if (accountId && !accessibleAccountIds.has(accountId)) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    const accountIds = accountId ? [accountId] : accounts.map((a) => a.id)

    if (platformUserId) {
      // Get specific conversation
      const messages = await db.socialMediaMessage.findMany({
        where: {
          accountId: { in: accountIds },
          platformUserId
        },
        orderBy: { createdAt: "asc" }
      })
      return NextResponse.json({ messages })
    }

    // Get all conversations (grouped by platformUserId)
    const messages = await db.socialMediaMessage.findMany({
      where: {
        accountId: { in: accountIds }
      },
      orderBy: { createdAt: "desc" }
    })

    // Group by platformUserId to get conversations
    const conversationsMap = new Map<string, {
      platformUserId: string
      platformUsername: string | null
      profilePicture: string | null
      lastMessage: typeof messages[0]
      unreadCount: number
      account: typeof accounts[0] | undefined
    }>()

    messages.forEach(msg => {
      const existing = conversationsMap.get(msg.platformUserId)
      if (!existing) {
        conversationsMap.set(msg.platformUserId, {
          platformUserId: msg.platformUserId,
          platformUsername: msg.platformUsername,
          profilePicture: msg.profilePicture,
          lastMessage: msg,
          unreadCount: msg.isRead || msg.direction === "OUTBOUND" ? 0 : 1,
          account: accounts.find(a => a.id === msg.accountId)
        })
      } else {
        if (!msg.isRead && msg.direction === "INBOUND") {
          existing.unreadCount++
        }
      }
    })

    const conversations = Array.from(conversationsMap.values())

    return NextResponse.json({
      accounts: accounts.map(serializeAccountOwnerType),
      conversations
    })
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST - Send a message (simulated)
export async function POST(request: NextRequest) {
  const session = await getSession()
  const socialMode = getSocialMediaMode()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (socialMode !== "SIMULATED_BETA") {
    return NextResponse.json(
      { error: "Live social DM sending is not enabled in this environment" },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { accountId, platformUserId, platformUsername, content } = body

    // Verify account ownership
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

    // Create message record
    const message = await db.socialMediaMessage.create({
      data: {
        platform: account.platform,
        accountId,
        platformUserId,
        platformUsername,
        direction: "OUTBOUND",
        content,
        isRead: true
      }
    })

    // In production, this would call the Instagram/TikTok API to send the message

    return NextResponse.json(message)
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

// PATCH - Mark messages as read
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { platformUserId, accountId } = body

    const account = await db.socialMediaAccount.findFirst({
      where: {
        id: accountId,
        ...buildAccountScope({
          studioId: session.user.studioId,
          teacherId: session.user.teacherId,
        }),
      },
      select: { id: true },
    })
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    await db.socialMediaMessage.updateMany({
      where: {
        accountId: account.id,
        platformUserId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark as read:", error)
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
  }
}














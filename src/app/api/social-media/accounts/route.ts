import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getSocialMediaMode } from "@/lib/social-media-mode"

type AccountOwnerType = "STUDIO" | "TEACHER"

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
      // Include legacy teacher-owned rows created before studioId was always set.
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

function serializeAccount(account: {
  id: string
  platform: "INSTAGRAM" | "TIKTOK"
  platformUserId: string
  username: string
  displayName: string | null
  profilePicture: string | null
  followerCount: number
  followingCount: number
  postsCount: number
  isActive: boolean
  lastSyncedAt: Date | null
  createdAt: Date
  studioId: string | null
  teacherId: string | null
  _count: { flows: number; messages: number }
}) {
  return {
    ...account,
    ownerType: account.teacherId ? "TEACHER" : "STUDIO",
  }
}

// GET - Fetch connected social accounts
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const accounts = await db.socialMediaAccount.findMany({
      where: {
        ...buildAccountScope({
          studioId: session.user.studioId,
          teacherId: session.user.teacherId,
        }),
      },
      select: publicAccountSelect,
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(accounts.map(serializeAccount))
  } catch (error) {
    console.error("Failed to fetch accounts:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

// POST - Connect new account (simplified - in production would use OAuth)
export async function POST(request: NextRequest) {
  const session = await getSession()
  const socialMode = getSocialMediaMode()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (socialMode !== "SIMULATED_BETA") {
    return NextResponse.json(
      { error: "Social provider OAuth is not enabled in this environment" },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { platform, username, accessToken, ownerType } = body
    const normalizedPlatform = String(platform || "").toUpperCase()
    if (normalizedPlatform !== "INSTAGRAM" && normalizedPlatform !== "TIKTOK") {
      return NextResponse.json({ error: "Platform must be INSTAGRAM or TIKTOK" }, { status: 400 })
    }

    const normalizedUsername = String(username || "").trim().replace(/^@/, "")
    if (!normalizedUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const requestedOwnerType: AccountOwnerType =
      ownerType === "TEACHER" || ownerType === "STUDIO"
        ? ownerType
        : session.user.teacherId
          ? "TEACHER"
          : "STUDIO"

    if (requestedOwnerType === "TEACHER" && !session.user.teacherId) {
      return NextResponse.json(
        { error: "Only teacher accounts can connect teacher-owned social accounts" },
        { status: 403 }
      )
    }
    if (requestedOwnerType === "STUDIO" && session.user.teacherId) {
      return NextResponse.json(
        { error: "Teacher users can only connect teacher-owned social accounts" },
        { status: 403 }
      )
    }

    // In production, this would handle OAuth flow
    // For now, we'll create a mock connection
    const platformUserId = `${normalizedPlatform.toLowerCase()}_${normalizedUsername}_${Date.now()}`

    const account = await db.socialMediaAccount.create({
      data: {
        platform: normalizedPlatform,
        platformUserId,
        username: normalizedUsername,
        displayName: normalizedUsername,
        accessToken: accessToken || "mock_token",
        studioId: requestedOwnerType === "STUDIO" ? session.user.studioId : null,
        teacherId: requestedOwnerType === "TEACHER" ? session.user.teacherId : null,
      },
      select: publicAccountSelect,
    })

    return NextResponse.json(serializeAccount(account))
  } catch (error) {
    console.error("Failed to connect account:", error)
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 })
  }
}

// DELETE - Disconnect account
export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const accountId = searchParams.get("id")

  if (!accountId) {
    return NextResponse.json({ error: "Account ID required" }, { status: 400 })
  }

  try {
    // Verify ownership
    const account = await db.socialMediaAccount.findFirst({
      where: {
        id: accountId,
        ...buildAccountScope({
          studioId: session.user.studioId,
          teacherId: session.user.teacherId,
        }),
      }
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    await db.socialMediaAccount.delete({
      where: { id: accountId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to disconnect account:", error)
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 })
  }
}












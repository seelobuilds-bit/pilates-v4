import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch connected social accounts
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const accounts = await db.socialMediaAccount.findMany({
      where: {
        OR: [
          { studioId: session.user.studioId },
          ...(session.user.teacherId ? [{ teacherId: session.user.teacherId }] : [])
        ]
      },
      include: {
        _count: {
          select: {
            flows: true,
            messages: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Failed to fetch accounts:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

// POST - Connect new account (simplified - in production would use OAuth)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { platform, username, accessToken } = body

    // In production, this would handle OAuth flow
    // For now, we'll create a mock connection
    const platformUserId = `${platform.toLowerCase()}_${username}_${Date.now()}`

    const account = await db.socialMediaAccount.create({
      data: {
        platform,
        platformUserId,
        username,
        displayName: username,
        accessToken: accessToken || "mock_token",
        studioId: session.user.role === "OWNER" ? session.user.studioId : null,
        teacherId: session.user.teacherId
      }
    })

    return NextResponse.json(account)
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
        OR: [
          { studioId: session.user.studioId },
          ...(session.user.teacherId ? [{ teacherId: session.user.teacherId }] : [])
        ]
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















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
      }
    })

    const accountIds = accounts.map(a => a.id)

    const flows = await db.socialMediaFlow.findMany({
      where: {
        accountId: { in: accountIds }
      },
      include: {
        account: true,
        trackingLinks: true,
        _count: {
          select: { events: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ accounts, flows })
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
      }
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
        account: true
      }
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

    return NextResponse.json(flow)
  } catch (error) {
    console.error("Failed to create flow:", error)
    return NextResponse.json({ error: "Failed to create flow" }, { status: 500 })
  }
}















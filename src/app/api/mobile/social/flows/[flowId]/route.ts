import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function ratioPercentage(numerator: number, denominator: number, precision = 1) {
  if (denominator <= 0) return 0
  const factor = Math.pow(10, precision)
  return Math.round((numerator / denominator) * 100 * factor) / factor
}

function parseFollowUpMessages(rawValue: string | null): { message: string; delayMinutes: number }[] {
  if (!rawValue) return []
  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const message = String((item as { message?: unknown }).message || "").trim()
        const delayMinutes = Number((item as { delayMinutes?: unknown }).delayMinutes || 0)
        if (!message) return null
        return { message, delayMinutes: Number.isFinite(delayMinutes) ? Math.max(0, delayMinutes) : 0 }
      })
      .filter((item): item is { message: string; delayMinutes: number } => item !== null)
  } catch {
    return []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Social workspace is available for teacher and studio owner accounts only" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

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
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const { flowId } = await params
    const flow = await db.socialMediaFlow.findFirst({
      where: {
        id: flowId,
        account: decoded.role === "TEACHER"
          ? {
              OR: [{ studioId: studio.id }, { teacherId: decoded.teacherId }],
            }
          : {
              OR: [{ studioId: studio.id }, { teacher: { studioId: studio.id } }],
            },
      },
      select: {
        id: true,
        name: true,
        description: true,
        triggerType: true,
        triggerKeywords: true,
        responseMessage: true,
        followUpMessages: true,
        includeBookingLink: true,
        bookingMessage: true,
        isActive: true,
        totalTriggered: true,
        totalResponded: true,
        totalBooked: true,
        postId: true,
        postUrl: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
            followerCount: true,
            isActive: true,
            lastSyncedAt: true,
          },
        },
        trackingLinks: {
          select: {
            id: true,
            code: true,
            campaign: true,
            source: true,
            medium: true,
            clicks: true,
            conversions: true,
            revenue: true,
            fullTrackingUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 30,
        },
        events: {
          select: {
            id: true,
            platformUserId: true,
            platformUsername: true,
            triggerContent: true,
            triggerType: true,
            responseSent: true,
            responseAt: true,
            clickedLink: true,
            clickedAt: true,
            converted: true,
            convertedAt: true,
            bookingId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 80,
        },
      },
    })

    if (!flow) {
      return NextResponse.json({ error: "Social flow not found" }, { status: 404 })
    }

    const [recentMessages] = await Promise.all([
      db.socialMediaMessage.findMany({
        where: {
          accountId: flow.account.id,
          flowId: flow.id,
        },
        select: {
          id: true,
          direction: true,
          content: true,
          isRead: true,
          createdAt: true,
          platformUserId: true,
          platformUsername: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 80,
      }),
    ])

    const followUps = parseFollowUpMessages(flow.followUpMessages)
    const clickedEvents = flow.events.filter((event) => event.clickedLink).length
    const convertedEvents = flow.events.filter((event) => event.converted).length

    return NextResponse.json({
      role: decoded.role,
      studio: {
        id: studio.id,
        name: studio.name,
        subdomain: studio.subdomain,
        primaryColor: studio.primaryColor,
        currency: studio.stripeCurrency,
      },
      flow: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        triggerType: flow.triggerType,
        triggerKeywords: flow.triggerKeywords,
        responseMessage: flow.responseMessage,
        followUpMessages: followUps,
        includeBookingLink: flow.includeBookingLink,
        bookingMessage: flow.bookingMessage,
        isActive: flow.isActive,
        totalTriggered: flow.totalTriggered,
        totalResponded: flow.totalResponded,
        totalBooked: flow.totalBooked,
        postId: flow.postId,
        postUrl: flow.postUrl,
        createdAt: flow.createdAt.toISOString(),
        updatedAt: flow.updatedAt.toISOString(),
        account: {
          id: flow.account.id,
          platform: flow.account.platform,
          username: flow.account.username,
          displayName: flow.account.displayName,
          followerCount: flow.account.followerCount,
          isActive: flow.account.isActive,
          lastSyncedAt: flow.account.lastSyncedAt?.toISOString() || null,
        },
      },
      stats: {
        responseRate: ratioPercentage(flow.totalResponded, flow.totalTriggered, 1),
        bookingRate: ratioPercentage(flow.totalBooked, flow.totalTriggered, 1),
        clickRateFromEvents: ratioPercentage(clickedEvents, flow.events.length, 1),
        conversionRateFromEvents: ratioPercentage(convertedEvents, flow.events.length, 1),
      },
      trackingLinks: flow.trackingLinks.map((link) => ({
        id: link.id,
        code: link.code,
        campaign: link.campaign,
        source: link.source,
        medium: link.medium,
        clicks: link.clicks,
        conversions: link.conversions,
        revenue: link.revenue,
        fullTrackingUrl: link.fullTrackingUrl,
        createdAt: link.createdAt.toISOString(),
      })),
      recentEvents: flow.events.map((event) => ({
        id: event.id,
        platformUserId: event.platformUserId,
        platformUsername: event.platformUsername,
        triggerContent: event.triggerContent,
        triggerType: event.triggerType,
        responseSent: event.responseSent,
        responseAt: event.responseAt?.toISOString() || null,
        clickedLink: event.clickedLink,
        clickedAt: event.clickedAt?.toISOString() || null,
        converted: event.converted,
        convertedAt: event.convertedAt?.toISOString() || null,
        bookingId: event.bookingId,
        createdAt: event.createdAt.toISOString(),
      })),
      recentMessages: recentMessages.map((message) => ({
        id: message.id,
        direction: message.direction,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
        platformUserId: message.platformUserId,
        platformUsername: message.platformUsername,
      })),
    })
  } catch (error) {
    console.error("Mobile social flow detail error:", error)
    return NextResponse.json({ error: "Failed to load social flow detail" }, { status: 500 })
  }
}

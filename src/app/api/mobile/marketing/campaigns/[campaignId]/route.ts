import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function ratioPercentage(numerator: number, denominator: number, precision = 1) {
  if (denominator <= 0) return 0
  const factor = Math.pow(10, precision)
  return Math.round((numerator / denominator) * 100 * factor) / factor
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
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

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Marketing is available for studio owner accounts only" }, { status: 403 })
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

    const { campaignId } = await params
    const campaign = await db.campaign.findFirst({
      where: {
        id: campaignId,
        studioId: studio.id,
      },
      select: {
        id: true,
        name: true,
        channel: true,
        status: true,
        subject: true,
        body: true,
        htmlBody: true,
        scheduledAt: true,
        sentAt: true,
        targetAll: true,
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        failedCount: true,
        createdAt: true,
        updatedAt: true,
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        messages: {
          select: {
            id: true,
            channel: true,
            direction: true,
            status: true,
            toAddress: true,
            toName: true,
            sentAt: true,
            deliveredAt: true,
            openedAt: true,
            clickedAt: true,
            failedReason: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 120,
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({
      role: "OWNER",
      studio: {
        id: studio.id,
        name: studio.name,
        subdomain: studio.subdomain,
        primaryColor: studio.primaryColor,
        currency: studio.stripeCurrency,
      },
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        subject: campaign.subject,
        body: campaign.body,
        htmlBody: campaign.htmlBody,
        scheduledAt: campaign.scheduledAt?.toISOString() || null,
        sentAt: campaign.sentAt?.toISOString() || null,
        targetAll: campaign.targetAll,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        failedCount: campaign.failedCount,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        segment: campaign.segment,
        location: campaign.location,
        template: campaign.template,
      },
      stats: {
        deliveryRate: ratioPercentage(campaign.deliveredCount, campaign.sentCount, 1),
        openRate: ratioPercentage(campaign.openedCount, campaign.deliveredCount, 1),
        clickRate: ratioPercentage(campaign.clickedCount, campaign.deliveredCount, 1),
        failureRate: ratioPercentage(campaign.failedCount, campaign.sentCount, 1),
      },
      recentMessages: campaign.messages.map((message) => ({
        id: message.id,
        channel: message.channel,
        direction: message.direction,
        status: message.status,
        toAddress: message.toAddress,
        toName: message.toName,
        sentAt: message.sentAt?.toISOString() || null,
        deliveredAt: message.deliveredAt?.toISOString() || null,
        openedAt: message.openedAt?.toISOString() || null,
        clickedAt: message.clickedAt?.toISOString() || null,
        failedReason: message.failedReason,
        createdAt: message.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Mobile marketing campaign detail error:", error)
    return NextResponse.json({ error: "Failed to load campaign detail" }, { status: 500 })
  }
}

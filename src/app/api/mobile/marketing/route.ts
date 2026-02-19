import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function buildSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    name: { contains: normalized, mode: "insensitive" as const },
  }
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

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const search = String(request.nextUrl.searchParams.get("search") || "")
    const searchWhere = buildSearchWhere(search)

    const campaignWhere = {
      studioId: studio.id,
      ...(searchWhere || {}),
    }

    const automationWhere = {
      studioId: studio.id,
      ...(searchWhere || {}),
    }

    const [campaigns, automations, campaignCounts, automationCounts] = await Promise.all([
      db.campaign.findMany({
        where: campaignWhere,
        select: {
          id: true,
          name: true,
          channel: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          totalRecipients: true,
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          failedCount: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 20,
      }),
      db.automation.findMany({
        where: automationWhere,
        select: {
          id: true,
          name: true,
          trigger: true,
          channel: true,
          status: true,
          totalSent: true,
          totalDelivered: true,
          totalOpened: true,
          totalClicked: true,
          updatedAt: true,
          _count: {
            select: {
              steps: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 20,
      }),
      Promise.all([
        db.campaign.count({ where: { studioId: studio.id } }),
        db.campaign.count({ where: { studioId: studio.id, status: "SCHEDULED" } }),
        db.campaign.count({ where: { studioId: studio.id, status: "SENT" } }),
      ]),
      Promise.all([
        db.automation.count({ where: { studioId: studio.id } }),
        db.automation.count({ where: { studioId: studio.id, status: "ACTIVE" } }),
        db.automation.count({ where: { studioId: studio.id, status: "DRAFT" } }),
      ]),
    ])

    return NextResponse.json({
      role: "OWNER",
      studio: studioSummary,
      filters: {
        search,
      },
      stats: {
        campaignsTotal: campaignCounts[0],
        campaignsScheduled: campaignCounts[1],
        campaignsSent: campaignCounts[2],
        automationsTotal: automationCounts[0],
        automationsActive: automationCounts[1],
        automationsDraft: automationCounts[2],
      },
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.toISOString() : null,
        sentAt: campaign.sentAt ? campaign.sentAt.toISOString() : null,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        failedCount: campaign.failedCount,
        createdAt: campaign.createdAt.toISOString(),
      })),
      automations: automations.map((automation) => ({
        id: automation.id,
        name: automation.name,
        trigger: automation.trigger,
        channel: automation.channel,
        status: automation.status,
        totalSent: automation.totalSent,
        totalDelivered: automation.totalDelivered,
        totalOpened: automation.totalOpened,
        totalClicked: automation.totalClicked,
        stepCount: automation._count.steps,
        updatedAt: automation.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Mobile marketing error:", error)
    return NextResponse.json({ error: "Failed to load marketing" }, { status: 500 })
  }
}

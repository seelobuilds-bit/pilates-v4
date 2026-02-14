import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch website analytics config and data
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "7d"
  const dataType = searchParams.get("type") || "overview"

  try {
    // Get or create config
    let config = await db.websiteAnalyticsConfig.findUnique({
      where: { studioId: session.user.studioId }
    })

    if (!config) {
      config = await db.websiteAnalyticsConfig.create({
        data: {
          studioId: session.user.studioId,
        }
      })
    }

    // Calculate date range
    const startDate = new Date()
    switch (period) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    if (dataType === "config") {
      return NextResponse.json({ config })
    }

    // Fetch analytics data
    const [
      totalPageViews,
      uniqueVisitors,
      totalConversions,
      topPages,
      topSources,
      deviceBreakdown,
      recentEvents,
      visitorTrend
    ] = await Promise.all([
      // Total page views
      db.websiteEvent.count({
        where: {
          studioId: session.user.studioId,
          type: "PAGE_VIEW",
          createdAt: { gte: startDate }
        }
      }),
      
      // Unique visitors
      db.websiteVisitor.count({
        where: {
          studioId: session.user.studioId,
          lastVisit: { gte: startDate }
        }
      }),
      
      // Conversions
      db.websiteVisitor.count({
        where: {
          studioId: session.user.studioId,
          hasConverted: true,
          convertedAt: { gte: startDate }
        }
      }),
      
      // Top pages
      db.websiteEvent.groupBy({
        by: ["pagePath"],
        where: {
          studioId: session.user.studioId,
          type: "PAGE_VIEW",
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10
      }),
      
      // Top traffic sources
      db.websiteVisitor.groupBy({
        by: ["firstSource"],
        where: {
          studioId: session.user.studioId,
          lastVisit: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      }),
      
      // Device breakdown
      db.websiteVisitor.groupBy({
        by: ["device"],
        where: {
          studioId: session.user.studioId,
          lastVisit: { gte: startDate }
        },
        _count: { id: true }
      }),
      
      // Recent events
      db.websiteEvent.findMany({
        where: {
          studioId: session.user.studioId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          visitor: {
            select: { visitorId: true, device: true, browser: true }
          }
        }
      }),
      
      // Visitor trend (daily for 7d, or hourly for 24h)
      period === "24h"
        ? db.$queryRaw`
            SELECT 
              DATE_TRUNC('hour', "createdAt") as period,
              COUNT(DISTINCT "visitorId") as visitors,
              COUNT(*) as pageviews
            FROM "WebsiteEvent"
            WHERE "studioId" = ${session.user.studioId}
              AND "createdAt" >= ${startDate}
              AND "type" = 'PAGE_VIEW'
            GROUP BY DATE_TRUNC('hour', "createdAt")
            ORDER BY period
          `
        : db.$queryRaw`
            SELECT 
              DATE_TRUNC('day', "createdAt") as period,
              COUNT(DISTINCT "visitorId") as visitors,
              COUNT(*) as pageviews
            FROM "WebsiteEvent"
            WHERE "studioId" = ${session.user.studioId}
              AND "createdAt" >= ${startDate}
              AND "type" = 'PAGE_VIEW'
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY period
          `
    ])

    // Calculate conversion rate
    const conversionRate = uniqueVisitors > 0 
      ? ((totalConversions / uniqueVisitors) * 100).toFixed(1)
      : "0"

    // Calculate avg pages per visit
    const avgPagesPerVisit = uniqueVisitors > 0
      ? (totalPageViews / uniqueVisitors).toFixed(1)
      : "0"

    return NextResponse.json({
      config,
      analytics: {
        overview: {
          totalPageViews,
          uniqueVisitors,
          totalConversions,
          conversionRate,
          avgPagesPerVisit
        },
        topPages: topPages.map(p => ({
          path: p.pagePath || "/",
          views: p._count.id
        })),
        topSources: topSources.map(s => ({
          source: s.firstSource || "Direct",
          visitors: s._count.id
        })),
        deviceBreakdown: deviceBreakdown.map(d => ({
          device: d.device || "Unknown",
          count: d._count.id
        })),
        recentEvents,
        visitorTrend
      }
    })
  } catch (error) {
    console.error("Failed to fetch website analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

// PATCH - Update website analytics config
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      websiteUrl,
      platform,
      isEnabled,
      trackPageViews,
      trackClicks,
      trackForms,
      trackScrollDepth,
      trackOutboundLinks,
      conversionGoals
    } = body

    const config = await db.websiteAnalyticsConfig.upsert({
      where: { studioId: session.user.studioId },
      update: {
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(platform !== undefined && { platform }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(trackPageViews !== undefined && { trackPageViews }),
        ...(trackClicks !== undefined && { trackClicks }),
        ...(trackForms !== undefined && { trackForms }),
        ...(trackScrollDepth !== undefined && { trackScrollDepth }),
        ...(trackOutboundLinks !== undefined && { trackOutboundLinks }),
        ...(conversionGoals !== undefined && { conversionGoals: JSON.stringify(conversionGoals) }),
      },
      create: {
        studioId: session.user.studioId,
        websiteUrl,
        platform,
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Failed to update website analytics config:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}






















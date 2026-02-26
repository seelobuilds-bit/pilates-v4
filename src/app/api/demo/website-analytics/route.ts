import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"
import { getDemoStudioId } from "@/lib/demo-studio"

function toSafeNumber(value: unknown) {
  if (typeof value === "bigint") return Number(value)
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function extractGroupCount(value: unknown) {
  if (!value || typeof value !== "object") return 0
  const record = value as Record<string, unknown>
  if (typeof record.id === "number") return record.id
  if (typeof record._all === "number") return record._all
  return 0
}

// GET - Fetch website analytics config and data
export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const requestedPeriod = searchParams.get("period") || "7d"
  const period = ["24h", "7d", "30d", "90d"].includes(requestedPeriod) ? requestedPeriod : "7d"
  const dataType = searchParams.get("type") || "overview"
  const endDate = new Date()
  const startDate = new Date(endDate)
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

  try {
    // Get or create config
    let config = await db.websiteAnalyticsConfig.findUnique({
      where: { studioId }
    })

    if (!config) {
      config = await db.websiteAnalyticsConfig.create({
        data: {
          studioId,
        }
      })
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
    ] = await runDbQueries([
      // Total page views
      () => db.websiteEvent.count({
        where: {
          studioId,
          type: "PAGE_VIEW",
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      }),
      
      // Unique visitors
      () => db.websiteVisitor.count({
        where: {
          studioId,
          lastVisit: {
            gte: startDate,
            lt: endDate
          }
        }
      }),
      
      // Conversions
      () => db.websiteVisitor.count({
        where: {
          studioId,
          hasConverted: true,
          convertedAt: {
            gte: startDate,
            lt: endDate
          }
        }
      }),
      
      // Top pages
      () => db.websiteEvent.groupBy({
        by: ["pagePath"] as const,
        where: {
          studioId,
          type: "PAGE_VIEW",
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10
      }),
      
      // Top traffic sources
      () => db.websiteVisitor.groupBy({
        by: ["firstSource"] as const,
        where: {
          studioId,
          lastVisit: {
            gte: startDate,
            lt: endDate
          }
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      }),
      
      // Device breakdown
      () => db.websiteVisitor.groupBy({
        by: ["device"] as const,
        where: {
          studioId,
          lastVisit: {
            gte: startDate,
            lt: endDate
          }
        },
        _count: { id: true },
        orderBy: { device: "asc" }
      }),
      
      // Recent events
      () => db.websiteEvent.findMany({
        where: {
          studioId,
          createdAt: {
            gte: startDate,
            lt: endDate
          }
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
      () => (period === "24h"
        ? db.$queryRaw`
            SELECT 
              DATE_TRUNC('hour', "createdAt") as period,
              COUNT(DISTINCT "visitorId") as visitors,
              COUNT(*) as pageviews
            FROM "WebsiteEvent"
            WHERE "studioId" = ${studioId}
              AND "createdAt" >= ${startDate}
              AND "createdAt" < ${endDate}
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
            WHERE "studioId" = ${studioId}
              AND "createdAt" >= ${startDate}
              AND "createdAt" < ${endDate}
              AND "type" = 'PAGE_VIEW'
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY period
          `
      )
    ])

    // Calculate conversion rate
    const conversionRate = uniqueVisitors > 0 
      ? ((totalConversions / uniqueVisitors) * 100).toFixed(1)
      : "0"

    // Calculate avg pages per visit
    const avgPagesPerVisit = uniqueVisitors > 0
      ? (totalPageViews / uniqueVisitors).toFixed(1)
      : "0"

    const normalizedVisitorTrend = Array.isArray(visitorTrend)
      ? visitorTrend.map((point: unknown) => {
          const row = (point || {}) as { period?: unknown; visitors?: unknown; pageviews?: unknown }
          const periodValue = row.period instanceof Date ? row.period.toISOString() : String(row.period || "")
          return {
            period: periodValue,
            visitors: toSafeNumber(row.visitors),
            pageviews: toSafeNumber(row.pageviews),
          }
        })
      : []
    const normalizedRecentEvents = JSON.parse(
      JSON.stringify(recentEvents, (_key, value) => (typeof value === "bigint" ? Number(value) : value))
    )

    return NextResponse.json({
      config,
      range: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
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
          views: extractGroupCount(p._count)
        })),
        topSources: topSources.map(s => ({
          source: s.firstSource || "Direct",
          visitors: extractGroupCount(s._count)
        })),
        deviceBreakdown: deviceBreakdown.map(d => ({
          device: d.device || "Unknown",
          count: extractGroupCount(d._count)
        })),
        recentEvents: normalizedRecentEvents,
        visitorTrend: normalizedVisitorTrend
      }
    })
  } catch (error) {
    console.error("Failed to fetch website analytics:", error)
    return NextResponse.json({
      config: null,
      range: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      analytics: {
        overview: {
          totalPageViews: 0,
          uniqueVisitors: 0,
          totalConversions: 0,
          conversionRate: "0",
          avgPagesPerVisit: "0",
        },
        topPages: [],
        topSources: [],
        deviceBreakdown: [],
        recentEvents: [],
        visitorTrend: [],
      },
      partial: true,
      warning: "Website analytics are temporarily unavailable. Retry in a moment.",
    })
  }
}

// PATCH - Update website analytics config
export async function PATCH(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
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
      where: { studioId },
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
        studioId,
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












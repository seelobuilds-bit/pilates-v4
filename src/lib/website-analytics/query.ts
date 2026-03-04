import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"
import { summarizeWebsiteOverview } from "@/lib/website-analytics/metrics"
import {
  extractGroupCount,
  normalizeVisitorTrend,
  type WebsiteAnalyticsPeriod,
} from "@/lib/website-analytics/reporting"

type WebsiteAnalyticsInput = {
  studioId: string
  startDate: Date
  endDate: Date
  period: WebsiteAnalyticsPeriod
}

export async function fetchWebsiteAnalyticsSnapshot({
  studioId,
  startDate,
  endDate,
  period,
}: WebsiteAnalyticsInput) {
  const [
    totalPageViews,
    uniqueVisitors,
    totalConversions,
    topPages,
    topSources,
    deviceBreakdown,
    recentEvents,
    visitorTrend,
  ] = await runDbQueries([
    () =>
      db.websiteEvent.count({
        where: {
          studioId,
          type: "PAGE_VIEW",
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
    () =>
      db.websiteVisitor.count({
        where: {
          studioId,
          lastVisit: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
    () =>
      db.websiteVisitor.count({
        where: {
          studioId,
          hasConverted: true,
          convertedAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
    () =>
      db.websiteEvent.groupBy({
        by: ["pagePath"] as const,
        where: {
          studioId,
          type: "PAGE_VIEW",
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    () =>
      db.websiteVisitor.groupBy({
        by: ["firstSource"] as const,
        where: {
          studioId,
          lastVisit: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    () =>
      db.websiteVisitor.groupBy({
        by: ["device"] as const,
        where: {
          studioId,
          lastVisit: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: { id: true },
        orderBy: { device: "asc" },
      }),
    () =>
      db.websiteEvent.findMany({
        where: {
          studioId,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          visitor: {
            select: { visitorId: true, device: true, browser: true },
          },
        },
      }),
    () =>
      period === "24h"
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
          `,
  ])

  const overview = summarizeWebsiteOverview(totalPageViews, uniqueVisitors, totalConversions)

  return {
    overview: {
      totalPageViews: overview.totalPageViews,
      uniqueVisitors: overview.uniqueVisitors,
      totalConversions: overview.totalConversions,
      conversionRate: overview.conversionRate,
      avgPagesPerVisit: overview.avgPagesPerVisit,
    },
    topPages: topPages.map((page) => ({
      path: page.pagePath || "/",
      views: extractGroupCount(page._count),
    })),
    topSources: topSources.map((source) => ({
      source: source.firstSource || "Direct",
      visitors: extractGroupCount(source._count),
    })),
    deviceBreakdown: deviceBreakdown.map((device) => ({
      device: device.device || "Unknown",
      count: extractGroupCount(device._count),
    })),
    recentEvents: JSON.parse(
      JSON.stringify(recentEvents, (_key, value) => (typeof value === "bigint" ? Number(value) : value))
    ),
    visitorTrend: normalizeVisitorTrend(visitorTrend),
  }
}


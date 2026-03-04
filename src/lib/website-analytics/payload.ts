export type WebsiteAnalyticsRangePayload = {
  period: string
  startDate: string
  endDate: string
}

export type WebsiteAnalyticsPayload = {
  overview: {
    totalPageViews: number
    uniqueVisitors: number
    totalConversions: number
    conversionRate: string
    avgPagesPerVisit: string
  }
  topPages: Array<{ path: string; views: number }>
  topSources: Array<{ source: string; visitors: number }>
  deviceBreakdown: Array<{ device: string; count: number }>
  recentEvents: unknown[]
  visitorTrend: Array<{ period: string; visitors: number; pageviews: number }>
}

export function toWebsiteAnalyticsRangePayload(range: {
  period: string
  startDate: Date
  endDate: Date
}): WebsiteAnalyticsRangePayload {
  return {
    period: range.period,
    startDate: range.startDate.toISOString(),
    endDate: range.endDate.toISOString(),
  }
}

export function buildWebsiteAnalyticsPayload(analytics: WebsiteAnalyticsPayload): WebsiteAnalyticsPayload {
  return {
    overview: analytics.overview,
    topPages: analytics.topPages,
    topSources: analytics.topSources,
    deviceBreakdown: analytics.deviceBreakdown,
    recentEvents: analytics.recentEvents,
    visitorTrend: analytics.visitorTrend,
  }
}

export function buildWebsiteAnalyticsFallbackPayload(): WebsiteAnalyticsPayload {
  return {
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
  }
}

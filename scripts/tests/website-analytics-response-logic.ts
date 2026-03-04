import assert from "node:assert/strict"
import {
  buildWebsiteAnalyticsFallbackPayload,
  buildWebsiteAnalyticsPayload,
} from "../../src/lib/website-analytics/payload"

function run() {
  const payload = buildWebsiteAnalyticsPayload({
    overview: {
      totalPageViews: 120,
      uniqueVisitors: 30,
      totalConversions: 6,
      conversionRate: "20",
      avgPagesPerVisit: "4",
    },
    topPages: [{ path: "/", views: 100 }],
    topSources: [{ source: "Direct", visitors: 20 }],
    deviceBreakdown: [{ device: "MOBILE", count: 18 }],
    recentEvents: [{ id: "evt_1" }],
    visitorTrend: [{ period: "2026-03-01T00:00:00.000Z", visitors: 5, pageviews: 8 }],
  })

  assert.equal(payload.overview.totalPageViews, 120)
  assert.equal(payload.topPages[0].path, "/")
  assert.equal(payload.visitorTrend[0].pageviews, 8)

  const fallback = buildWebsiteAnalyticsFallbackPayload()
  assert.deepEqual(fallback, {
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
  })

  console.log("Website analytics response logic passed")
}

run()

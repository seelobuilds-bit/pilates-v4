import assert from "node:assert/strict"
import {
  summarizeAutomationDeliveryMetrics,
  summarizeDeliveryMetrics,
} from "../../src/lib/marketing/analytics"
import { summarizeWebsiteOverview } from "../../src/lib/website-analytics/metrics"
import {
  extractGroupCount,
  normalizeVisitorTrend,
  resolveWebsiteAnalyticsRange,
} from "../../src/lib/website-analytics/reporting"

function run() {
  const website = summarizeWebsiteOverview(125, 25, 4)
  assert.deepEqual(website, {
    totalPageViews: 125,
    uniqueVisitors: 25,
    totalConversions: 4,
    conversionRate: "16",
    avgPagesPerVisit: "5",
  })

  const websiteZero = summarizeWebsiteOverview(0, 0, 0)
  assert.deepEqual(websiteZero, {
    totalPageViews: 0,
    uniqueVisitors: 0,
    totalConversions: 0,
    conversionRate: "0",
    avgPagesPerVisit: "0",
  })

  const referenceDate = new Date("2026-03-04T12:00:00.000Z")
  const websiteRange = resolveWebsiteAnalyticsRange("30d", referenceDate)
  assert.equal(websiteRange.period, "30d")
  assert.equal(websiteRange.endDate.toISOString(), "2026-03-04T12:00:00.000Z")
  assert.equal(websiteRange.startDate.toISOString(), "2026-02-02T12:00:00.000Z")

  const fallbackRange = resolveWebsiteAnalyticsRange("invalid", referenceDate)
  assert.equal(fallbackRange.period, "7d")
  assert.equal(fallbackRange.startDate.toISOString(), "2026-02-25T12:00:00.000Z")

  assert.equal(extractGroupCount({ id: 12 }), 12)
  assert.equal(extractGroupCount({ _all: 3 }), 3)
  assert.equal(extractGroupCount({}), 0)

  const trend = normalizeVisitorTrend([
    { period: new Date("2026-03-01T00:00:00.000Z"), visitors: "5", pageviews: BigInt(9) },
  ])
  assert.deepEqual(trend, [
    { period: "2026-03-01T00:00:00.000Z", visitors: 5, pageviews: 9 },
  ])

  const delivery = summarizeDeliveryMetrics(100, 80, 30, 12, 5)
  assert.deepEqual(delivery, {
    deliveryRate: 80,
    openRate: 37.5,
    clickRate: 15,
    failureRate: 5,
  })

  const automation = summarizeAutomationDeliveryMetrics(90, 72, 18, 9, 6, 120)
  assert.deepEqual(automation, {
    deliveryRate: 80,
    openRate: 25,
    clickRate: 12.5,
    failureRate: 5,
  })

  console.log("Website and marketing analytics logic passed")
}

run()

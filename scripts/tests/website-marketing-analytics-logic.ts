import assert from "node:assert/strict"
import {
  summarizeAutomationDeliveryMetrics,
  summarizeDeliveryMetrics,
} from "../../src/lib/marketing/analytics"
import { summarizeWebsiteOverview } from "../../src/lib/website-analytics/metrics"

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

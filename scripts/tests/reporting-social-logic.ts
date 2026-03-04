import assert from "node:assert/strict"
import { buildSocialSummary } from "../../src/lib/reporting/social"

const summary = buildSocialSummary({
  activeFlows: 4,
  totalTriggered: 23,
  totalResponded: 11,
  totalBooked: 5,
})

assert.deepEqual(summary, {
  activeFlows: 4,
  totalTriggered: 23,
  totalResponded: 11,
  totalBooked: 5,
  conversionRate: 21.7,
})

const emptySummary = buildSocialSummary({
  activeFlows: 0,
  totalTriggered: 0,
  totalResponded: 0,
  totalBooked: 0,
})

assert.equal(emptySummary.conversionRate, 0)

console.log("Reporting social logic passed")

import assert from "node:assert/strict"
import { buildMobileClientReportResponse } from "../../src/lib/reporting/mobile-client-report-response"

const response = buildMobileClientReportResponse({
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: null,
    currency: "EUR",
  },
  periodDays: 7,
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  rangeStart: new Date("2026-02-27T00:00:00.000Z"),
  rangeEnd: new Date("2026-03-04T23:59:59.999Z"),
  metrics: {
    currentBooked: 12,
    previousBooked: 10,
    currentCompleted: 9,
    previousCompleted: 8,
    currentCancelled: 3,
    previousCancelled: 2,
    currentCompletionRate: 75,
    previousCompletionRate: 80,
  },
  nextBooking: {
    classSession: {
      startTime: "2026-03-08T10:30:00.000Z",
      classType: { name: "Athletic Core" },
    },
  },
  series: [],
})

assert.equal(response.role, "CLIENT")
assert.equal(response.metrics.length, 4)
assert.equal(response.highlights[0].label, "Next class")

console.log("Reporting mobile client response logic passed")

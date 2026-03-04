import assert from "node:assert/strict"
import { buildMobileOwnerReportResponse } from "../../src/lib/reporting/mobile-owner-report-response"

const response = buildMobileOwnerReportResponse({
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: null,
    currency: "EUR",
  },
  periodDays: 30,
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  rangeStart: new Date("2026-02-03T00:00:00.000Z"),
  rangeEnd: new Date("2026-03-04T23:59:59.999Z"),
  metrics: {
    currentRevenue: 100,
    previousRevenue: 50,
    currentBooked: 10,
    previousBooked: 8,
    currentClasses: 5,
    previousClasses: 4,
    currentFillRate: 75,
    previousFillRate: 60,
    currentNewClients: 3,
    previousNewClients: 1,
  },
  sessions: [
    {
      classType: { name: "Reformer" },
      capacity: 10,
      bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }],
    },
  ],
  series: [],
})

assert.equal(response.role, "OWNER")
assert.equal(response.metrics.length, 5)
assert.equal(response.highlights[0].label, "Reformer")

console.log("Reporting mobile owner response logic passed")

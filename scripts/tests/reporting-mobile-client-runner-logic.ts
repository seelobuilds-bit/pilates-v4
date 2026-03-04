import assert from "node:assert/strict"
import { runMobileClientReport } from "../../src/lib/reporting/mobile-client-report-runner"

const response = runMobileClientReport({
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: null,
    currency: "EUR",
  },
  periodDays: 7,
  currentStart: new Date("2026-03-01T00:00:00.000Z"),
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  responseEnd: new Date("2026-03-04T23:59:59.999Z"),
  currentBookings: [
    {
      status: "COMPLETED",
      classSession: { startTime: new Date("2026-03-01T10:00:00.000Z") },
    },
  ],
  previousBookings: [],
  nextBooking: {
    classSession: {
      startTime: new Date("2026-03-06T10:00:00.000Z"),
      classType: { name: "Athletic Core" },
    },
  },
})

assert.equal(response.role, "CLIENT")
assert.equal(response.metrics.length, 4)
assert.equal(response.series.length, 4)

console.log("Reporting mobile client runner logic passed")

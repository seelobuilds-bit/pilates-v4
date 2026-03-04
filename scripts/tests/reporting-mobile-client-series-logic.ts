import assert from "node:assert/strict"
import { buildMobileClientSeries } from "../../src/lib/reporting/mobile-client-report-series"

const series = buildMobileClientSeries({
  startDate: new Date("2026-03-01T00:00:00.000Z"),
  endDate: new Date("2026-03-05T00:00:00.000Z"),
  bookings: [
    {
      status: "PENDING",
      classSession: { startTime: new Date("2026-03-01T10:00:00.000Z") },
    },
    {
      status: "COMPLETED",
      classSession: { startTime: new Date("2026-03-01T12:00:00.000Z") },
    },
    {
      status: "CANCELLED",
      classSession: { startTime: new Date("2026-03-02T12:00:00.000Z") },
    },
  ],
})

assert.equal(series.length, 4)
assert.deepEqual(series[0].metrics, {
  booked: 2,
  completed: 1,
  cancelled: 0,
  "completion-rate": 50,
})
assert.deepEqual(series[1].metrics, {
  booked: 0,
  completed: 0,
  cancelled: 1,
  "completion-rate": 0,
})

console.log("Reporting mobile client series logic passed")

import assert from "node:assert/strict"
import { buildMobileOwnerSeries } from "../../src/lib/reporting/mobile-owner-report-series"

const series = buildMobileOwnerSeries({
  startDate: new Date("2026-03-01T00:00:00.000Z"),
  endDate: new Date("2026-03-05T00:00:00.000Z"),
  bookings: [
    {
      status: "CONFIRMED",
      paidAmount: 20,
      classSession: {
        startTime: new Date("2026-03-01T12:00:00.000Z"),
        classType: { price: 25 },
      },
    },
    {
      status: "CANCELLED",
      paidAmount: 50,
      classSession: {
        startTime: new Date("2026-03-02T12:00:00.000Z"),
        classType: { price: 50 },
      },
    },
  ],
  sessions: [
    {
      startTime: new Date("2026-03-01T08:00:00.000Z"),
      capacity: 10,
      bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
    },
  ],
  newClients: [{ createdAt: new Date("2026-03-01T06:00:00.000Z") }],
})

assert.equal(series.length, 4)
assert.deepEqual(series[0].metrics, {
  revenue: 20,
  bookings: 1,
  classes: 1,
  "fill-rate": 20,
  "new-clients": 1,
})
assert.deepEqual(series[1].metrics, {
  revenue: 0,
  bookings: 0,
  classes: 0,
  "fill-rate": 0,
  "new-clients": 0,
})

console.log("Reporting mobile owner series logic passed")

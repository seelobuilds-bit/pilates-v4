import assert from "node:assert/strict"
import { buildMobileTeacherSeries } from "../../src/lib/reporting/mobile-teacher-report-series"

const series = buildMobileTeacherSeries({
  startDate: new Date("2026-03-01T00:00:00.000Z"),
  endDate: new Date("2026-03-05T00:00:00.000Z"),
  bookings: [
    {
      status: "COMPLETED",
      clientId: "a",
      paidAmount: null,
      classSession: {
        startTime: new Date("2026-03-01T10:00:00.000Z"),
        classType: { price: 30 },
      },
    },
    {
      status: "CONFIRMED",
      clientId: "b",
      paidAmount: 20,
      classSession: {
        startTime: new Date("2026-03-01T11:00:00.000Z"),
        classType: { price: 30 },
      },
    },
    {
      status: "CANCELLED",
      clientId: "c",
      paidAmount: 99,
      classSession: {
        startTime: new Date("2026-03-01T12:00:00.000Z"),
        classType: { price: 99 },
      },
    },
  ],
  sessions: [
    {
      startTime: new Date("2026-03-01T09:00:00.000Z"),
      capacity: 10,
      bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
    },
  ],
})

assert.equal(series.length, 4)
assert.deepEqual(series[0].metrics, {
  revenue: 50,
  classes: 1,
  students: 2,
  "fill-rate": 20,
  "completion-rate": 50,
})

console.log("Reporting mobile teacher series logic passed")

import assert from "node:assert/strict"
import { buildStudioOwnerWindowMetrics } from "../../src/lib/reporting/studio-owner-window-metrics"

const summary = buildStudioOwnerWindowMetrics({
  currentBookings: [
    {
      status: "CONFIRMED",
      paidAmount: 20,
      classSession: { classType: { price: 25 } },
    },
    {
      status: "COMPLETED",
      paidAmount: null,
      classSession: { classType: { price: 25 } },
    },
    {
      status: "NO_SHOW",
      paidAmount: 30,
      classSession: { classType: { price: 30 } },
    },
    {
      status: "CANCELLED",
      paidAmount: 999,
      classSession: { classType: { price: 999 } },
    },
  ],
  previousBookings: [
    {
      status: "CONFIRMED",
      paidAmount: null,
      classSession: { classType: { price: 40 } },
    },
    {
      status: "CANCELLED",
      paidAmount: 100,
      classSession: { classType: { price: 100 } },
    },
  ],
  currentSessions: [
    {
      capacity: 10,
      bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
    },
    {
      capacity: 8,
      bookings: [{ status: "NO_SHOW" }, { status: "COMPLETED" }],
    },
  ],
  previousSessions: [
    {
      capacity: 10,
      bookings: [{ status: "COMPLETED" }, { status: "CANCELLED" }],
    },
  ],
  currentNewClients: 3,
  previousNewClients: 1,
  periodEnd: new Date("2026-03-15T12:00:00.000Z"),
})

assert.equal(summary.currentRevenue, 75)
assert.equal(summary.previousRevenue, 40)
assert.equal(summary.currentBooked, 3)
assert.equal(summary.previousBooked, 1)
assert.equal(summary.currentClasses, 2)
assert.equal(summary.previousClasses, 1)
assert.equal(summary.currentFillRate, 22.2)
assert.equal(summary.previousFillRate, 10)
assert.equal(summary.currentNewClients, 3)
assert.equal(summary.previousNewClients, 1)

console.log("Reporting studio owner metrics logic passed")

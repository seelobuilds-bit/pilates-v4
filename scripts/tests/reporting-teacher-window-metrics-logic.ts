import assert from "node:assert/strict"
import { buildTeacherWindowMetrics } from "../../src/lib/reporting/teacher-window-metrics"

const summary = buildTeacherWindowMetrics({
  currentSessions: [
    {
      capacity: 10,
      classType: { name: "Reformer Beginner" },
      bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
    },
    {
      capacity: 8,
      classType: { name: "Reformer Beginner" },
      bookings: [{ status: "NO_SHOW" }, { status: "COMPLETED" }],
    },
  ],
  previousSessions: [
    {
      capacity: 6,
      classType: { name: "Mens Only Class" },
      bookings: [{ status: "COMPLETED" }],
    },
  ],
  currentBookings: [
    { status: "COMPLETED", clientId: "a", paidAmount: 20, classSession: { classType: { price: 17 } } },
    { status: "CONFIRMED", clientId: "b", paidAmount: null, classSession: { classType: { price: 17 } } },
    { status: "CANCELLED", clientId: "c", paidAmount: 0, classSession: { classType: { price: 17 } } },
    { status: "NO_SHOW", clientId: "a", paidAmount: 17, classSession: { classType: { price: 17 } } },
  ],
  previousBookings: [
    { status: "COMPLETED", clientId: "x", paidAmount: 15, classSession: { classType: { price: 15 } } },
    { status: "CANCELLED", clientId: "y", paidAmount: 0, classSession: { classType: { price: 15 } } },
  ],
  decimals: 1,
})

assert.equal(summary.currentRevenue, 54)
assert.equal(summary.previousRevenue, 15)
assert.equal(summary.currentClasses, 2)
assert.equal(summary.previousClasses, 1)
assert.equal(summary.currentStudents, 2)
assert.equal(summary.previousStudents, 1)
assert.equal(summary.currentFillRate, 22.5)
assert.equal(summary.previousFillRate, 16.7)
assert.equal(summary.currentCompletionRate, 33.3)
assert.equal(summary.previousCompletionRate, 100)

console.log("Reporting teacher window metrics logic passed")

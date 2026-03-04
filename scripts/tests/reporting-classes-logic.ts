import assert from "node:assert/strict"
import { buildClassesSummary } from "../../src/lib/reporting/classes"

const summary = buildClassesSummary([
  {
    classTypeId: "c1",
    capacity: 10,
    startTime: new Date("2026-03-02T09:00:00.000Z"),
    bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
    location: { name: "Central" },
    teacher: { user: { firstName: "Amelia", lastName: "Wilson" } },
    classType: { name: "Reformer" },
    _count: { waitlists: 2 },
  },
  {
    classTypeId: "c2",
    capacity: 8,
    startTime: new Date("2026-03-03T12:00:00.000Z"),
    bookings: [{ status: "COMPLETED" }],
    location: { name: "North" },
    teacher: { user: { firstName: "Amelia", lastName: "Wilson" } },
    classType: { name: "Tower" },
    _count: { waitlists: 0 },
  },
])

assert.equal(summary.total, 2)
assert.equal(summary.totalCapacity, 18)
assert.equal(summary.totalAttendance, 3)
assert.equal(summary.averageFill, 16)
assert.deepEqual(summary.byLocation, [
  { name: "Central", count: 1 },
  { name: "North", count: 1 },
])
assert.deepEqual(summary.byTeacher, [{ name: "Amelia Wilson", count: 2 }])
assert.equal(summary.byTimeSlot.length, 2)
assert.equal(summary.byDay[0].day, "Mon")
assert.equal(summary.byDay[0].fill, 20)
assert.equal(summary.topClasses[0].id, "c1")
assert.equal(summary.topClasses[0].waitlist, 2)
assert.equal(summary.underperforming.length, 1)
assert.equal(summary.underperforming[0].id, "c2")
assert.equal(summary.underperforming[0].avgFill, 16)

console.log("Reporting classes logic passed")

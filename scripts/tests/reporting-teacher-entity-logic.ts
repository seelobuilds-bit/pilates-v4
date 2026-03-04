import assert from "node:assert/strict"
import { buildTeacherEntityReportSummary } from "../../src/lib/reporting/teacher-entity"

const allClassSessions = [
  {
    startTime: new Date("2026-01-10T09:00:00.000Z"),
    classType: { name: "Reformer Flow", price: 30 },
    location: { name: "Studio A" },
  },
  {
    startTime: new Date("2026-02-10T09:00:00.000Z"),
    classType: { name: "Reformer Flow", price: 30 },
    location: { name: "Studio B" },
  },
  {
    startTime: new Date("2026-03-10T09:00:00.000Z"),
    classType: { name: "Power Core", price: 40 },
    location: { name: "Studio A" },
  },
]

const reportClassSessions = [allClassSessions[2]]
const reportBookings = [
  {
    clientId: "c1",
    status: "COMPLETED",
    paidAmount: null,
    classSession: {
      startTime: new Date("2026-03-10T09:00:00.000Z"),
      classType: { price: 40 },
    },
    client: { firstName: "Alice", lastName: "Jones" },
  },
  {
    clientId: "c1",
    status: "CONFIRMED",
    paidAmount: 45,
    classSession: {
      startTime: new Date("2026-03-10T09:00:00.000Z"),
      classType: { price: 40 },
    },
    client: { firstName: "Alice", lastName: "Jones" },
  },
  {
    clientId: "c2",
    status: "CANCELLED",
    paidAmount: null,
    classSession: {
      startTime: new Date("2026-03-10T09:00:00.000Z"),
      classType: { price: 40 },
    },
    client: { firstName: "Bob", lastName: "Smith" },
  },
]

const summary = buildTeacherEntityReportSummary({
  reportClassSessions,
  reportBookings,
  allClassSessions,
  endDate: new Date("2026-03-15T00:00:00.000Z"),
  monthOffsets: [-2, -1, 0],
})

assert.equal(summary.stats.totalClasses, 1)
assert.equal(summary.stats.totalStudents, 2)
assert.equal(summary.extendedStats.revenue, 85)
assert.equal(summary.extendedStats.avgClassSize, 2)
assert.equal(summary.extendedStats.completionRate, 50)
assert.equal(summary.extendedStats.retentionRate, 100)
assert.equal(summary.extendedStats.topClients[0]?.name, "Alice Jones")
assert.equal(summary.extendedStats.topClients[0]?.bookings, 2)
assert.equal(summary.extendedStats.monthlyClasses.length, 3)
assert.deepEqual(
  summary.extendedStats.monthlyClasses.map((bucket) => bucket.count),
  [1, 1, 1]
)

console.log("Reporting teacher entity logic passed")


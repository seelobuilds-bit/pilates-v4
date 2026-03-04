import assert from "node:assert/strict"
import { buildClientEntityStats, mapClientCommunications } from "../../src/lib/reporting/client-entity"

const reportBookings = [
  {
    status: "COMPLETED",
    paidAmount: null,
    createdAt: new Date("2026-03-01T12:00:00.000Z"),
    classSession: {
      startTime: new Date("2026-03-02T09:00:00.000Z"),
      classType: { name: "Reformer", price: 40 },
      teacher: { user: { firstName: "Ada", lastName: "Bell" } },
      location: { name: "City Studio" },
    },
  },
  {
    status: "CONFIRMED",
    paidAmount: 55,
    createdAt: new Date("2026-03-03T12:00:00.000Z"),
    classSession: {
      startTime: new Date("2026-03-04T09:00:00.000Z"),
      classType: { name: "Mat", price: 30 },
      teacher: { user: { firstName: "Leo", lastName: "Hart" } },
      location: { name: "Harbor Studio" },
    },
  },
  {
    status: "CANCELLED",
    paidAmount: null,
    createdAt: new Date("2026-03-05T12:00:00.000Z"),
    classSession: {
      startTime: new Date("2026-03-06T09:00:00.000Z"),
      classType: { name: "Mat", price: 30 },
      teacher: { user: { firstName: "Leo", lastName: "Hart" } },
      location: { name: "Harbor Studio" },
    },
  },
]

const stats = buildClientEntityStats({
  reportBookings,
  endDate: new Date("2026-03-15T00:00:00.000Z"),
  credits: 3,
})

assert.equal(stats.totalSpent, 95)
assert.equal(stats.totalBookings, 2)
assert.equal(stats.completedClasses, 1)
assert.equal(stats.cancelRate, 33.3)
assert.equal(stats.membershipType, "3 credits available")
assert.equal(stats.classBreakdown.length, 2)
assert.equal(stats.teacherBreakdown.length, 2)
assert.equal(stats.locationBreakdown.length, 2)
assert.equal(stats.monthlyBookings.length, 6)
assert.equal(stats.activityTimeline.length, 3)

const communications = mapClientCommunications([
  {
    id: "m1",
    channel: "CHAT",
    direction: "INBOUND",
    subject: null,
    body: "Hi there",
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
  },
])

assert.deepEqual(communications, [
  {
    id: "m1",
    type: "chat",
    direction: "inbound",
    subject: undefined,
    content: "Hi there",
    timestamp: "2026-03-01T10:00:00.000Z",
  },
])

console.log("Reporting client entity logic passed")


import assert from "node:assert/strict"
import { buildLocationEntityStats } from "../../src/lib/reporting/location-entity"

const classSessions = [
  {
    startTime: new Date("2026-03-01T09:00:00.000Z"),
    teacher: { user: { firstName: "Ada", lastName: "Bell" } },
  },
  {
    startTime: new Date("2026-03-02T09:00:00.000Z"),
    teacher: { user: { firstName: "Leo", lastName: "Hart" } },
  },
]

const bookings = [
  {
    clientId: "c1",
    status: "COMPLETED",
    paidAmount: null,
    createdAt: new Date("2026-03-01T12:00:00.000Z"),
    client: { firstName: "Mia", lastName: "Lopez", isActive: true },
    classSession: {
      startTime: new Date("2026-03-01T09:00:00.000Z"),
      classType: { name: "Reformer", price: 40 },
    },
  },
  {
    clientId: "c2",
    status: "CONFIRMED",
    paidAmount: 35,
    createdAt: new Date("2026-03-02T12:00:00.000Z"),
    client: { firstName: "Nia", lastName: "Stone", isActive: false },
    classSession: {
      startTime: new Date("2026-03-02T09:00:00.000Z"),
      classType: { name: "Mat", price: 30 },
    },
  },
  {
    clientId: "c3",
    status: "CANCELLED",
    paidAmount: null,
    createdAt: new Date("2026-03-03T12:00:00.000Z"),
    client: { firstName: "Ola", lastName: "Price", isActive: true },
    classSession: {
      startTime: new Date("2026-03-03T09:00:00.000Z"),
      classType: { name: "Mat", price: 30 },
    },
  },
]

const stats = buildLocationEntityStats({
  classSessions,
  bookings,
  endDate: new Date("2026-03-15T00:00:00.000Z"),
})

assert.equal(stats.totalBookings, 2)
assert.equal(stats.totalRevenue, 75)
assert.equal(stats.activeClients, 1)
assert.equal(stats.avgClassSize, 1)
assert.equal(stats.topClasses[0]?.name, "Reformer")
assert.equal(stats.topTeachers.length, 2)
assert.equal(stats.monthlyRevenue.length, 6)
assert.equal(stats.recentBookings.length, 2)

console.log("Reporting location entity logic passed")


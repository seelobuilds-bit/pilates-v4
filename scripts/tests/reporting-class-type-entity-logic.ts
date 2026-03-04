import assert from "node:assert/strict"
import { buildClassTypeEntityStats } from "../../src/lib/reporting/class-type-entity"

const classSessions = [
  {
    startTime: new Date("2026-03-01T09:00:00.000Z"),
    capacity: 10,
    locationId: "loc-1",
    teacherId: "teacher-1",
    teacher: { user: { firstName: "Ada", lastName: "Bell" } },
    location: { name: "City Studio" },
    _count: { bookings: 4 },
  },
  {
    startTime: new Date("2026-03-02T09:00:00.000Z"),
    capacity: 10,
    locationId: "loc-2",
    teacherId: "teacher-2",
    teacher: { user: { firstName: "Leo", lastName: "Hart" } },
    location: { name: "Harbor Studio" },
    _count: { bookings: 3 },
  },
]

const bookings = [
  {
    status: "COMPLETED",
    paidAmount: null,
    classSession: {
      startTime: new Date("2026-03-01T09:00:00.000Z"),
      location: { name: "City Studio" },
    },
  },
  {
    status: "CONFIRMED",
    paidAmount: 55,
    classSession: {
      startTime: new Date("2026-03-01T09:00:00.000Z"),
      location: { name: "City Studio" },
    },
  },
  {
    status: "CANCELLED",
    paidAmount: null,
    classSession: {
      startTime: new Date("2026-03-02T09:00:00.000Z"),
      location: { name: "Harbor Studio" },
    },
  },
]

const stats = buildClassTypeEntityStats({
  classSessions,
  bookings,
  classPrice: 50,
  endDate: new Date("2026-03-15T00:00:00.000Z"),
})

assert.equal(stats.totalBookings, 3)
assert.equal(stats.totalRevenue, 105)
assert.equal(stats.avgAttendance, 1)
assert.equal(stats.topTeachers[0]?.name, "Ada Bell")
assert.equal(stats.topLocations[0]?.name, "City Studio")
assert.equal(stats.monthlyBookings.length, 6)
assert.equal(stats.recentClasses.length, 2)
assert.equal(stats.popularTimes.length > 0, true)

console.log("Reporting class-type entity logic passed")


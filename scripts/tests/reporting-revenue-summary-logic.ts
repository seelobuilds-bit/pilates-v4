import assert from "node:assert/strict"
import { buildRevenueSummary } from "../../src/lib/reporting/revenue-summary"

const summary = buildRevenueSummary({
  bookings: [
    {
      status: "CONFIRMED",
      paidAmount: 20,
      classSession: {
        classType: { name: "Reformer", price: 25 },
        location: { name: "Central" },
      },
    },
    {
      status: "COMPLETED",
      paidAmount: null,
      classSession: {
        classType: { name: "Reformer", price: 25 },
        location: { name: "Central" },
      },
    },
    {
      status: "NO_SHOW",
      paidAmount: 30,
      classSession: {
        classType: { name: "Tower", price: 30 },
        location: { name: "North" },
      },
    },
    {
      status: "CANCELLED",
      paidAmount: 999,
      classSession: {
        classType: { name: "Ignored", price: 999 },
        location: { name: "Ignored" },
      },
    },
  ],
  previousBookings: [
    {
      status: "CONFIRMED",
      paidAmount: null,
      classSession: {
        classType: { price: 40 },
      },
    },
    {
      status: "CANCELLED",
      paidAmount: 100,
      classSession: {
        classType: { price: 100 },
      },
    },
  ],
  monthlyBookings: [
    {
      status: "COMPLETED",
      paidAmount: 15,
      classSession: {
        startTime: new Date("2026-03-02T09:00:00.000Z"),
        classType: { price: 25 },
      },
    },
    {
      status: "COMPLETED",
      paidAmount: null,
      classSession: {
        startTime: new Date("2026-02-10T09:00:00.000Z"),
        classType: { price: 35 },
      },
    },
    {
      status: "CANCELLED",
      paidAmount: 999,
      classSession: {
        startTime: new Date("2026-03-03T09:00:00.000Z"),
        classType: { price: 999 },
      },
    },
  ],
  referenceDate: new Date("2026-03-15T12:00:00.000Z"),
})

assert.equal(summary.total, 75)
assert.equal(summary.previousTotal, 40)

assert.deepEqual(summary.byLocation, [
  { name: "Central", amount: 45 },
  { name: "North", amount: 30 },
])
assert.deepEqual(summary.byClassType, [
  { name: "Reformer", amount: 45 },
  { name: "Tower", amount: 30 },
])

assert.equal(summary.monthly.length, 6)
assert.deepEqual(summary.monthly.map((bucket) => bucket.month), ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"])
assert.equal(summary.monthly[4].amount, 35)
assert.equal(summary.monthly[5].amount, 15)
assert.equal(summary.monthly[4].target, 35)
assert.equal(summary.monthly[5].target, 15)

console.log("Reporting revenue summary logic passed")

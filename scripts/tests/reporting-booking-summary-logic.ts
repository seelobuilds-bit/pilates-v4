import assert from "node:assert/strict"
import { buildBookingSummary } from "../../src/lib/reporting/bookings"

const summary = buildBookingSummary({
  bookings: [
    { status: "CONFIRMED", clientId: "c1" },
    { status: "COMPLETED", clientId: "c1" },
    { status: "NO_SHOW", clientId: "c2" },
    { status: "CANCELLED", clientId: "c3" },
  ],
  clientCreatedAtById: new Map([
    ["c1", new Date("2026-03-02T00:00:00.000Z")],
    ["c2", new Date("2026-02-15T00:00:00.000Z")],
    ["c3", new Date("2026-03-02T00:00:00.000Z")],
  ]),
  startDate: new Date("2026-03-01T00:00:00.000Z"),
  reportEndDate: new Date("2026-03-05T00:00:00.000Z"),
})

assert.equal(summary.total, 3)
assert.equal(summary.uniqueClients, 2)
assert.equal(summary.newClientBookings, 2)
assert.equal(summary.averageBookingsPerClient, 1.5)
assert.deepEqual(summary.byStatus, [
  { status: "CONFIRMED", count: 1 },
  { status: "COMPLETED", count: 1 },
  { status: "NO_SHOW", count: 1 },
  { status: "CANCELLED", count: 1 },
])

console.log("Reporting booking summary logic passed")

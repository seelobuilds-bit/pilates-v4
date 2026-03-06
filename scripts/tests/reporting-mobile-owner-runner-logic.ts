import assert from "node:assert/strict"
import { runMobileOwnerReport } from "../../src/lib/reporting/mobile-owner-report-runner"

const response = runMobileOwnerReport({
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: null,
    currency: "EUR",
  },
  periodDays: 30,
  currentStart: new Date("2026-03-01T00:00:00.000Z"),
  previousStart: new Date("2026-02-01T00:00:00.000Z"),
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  responseEnd: new Date("2026-03-04T23:59:59.999Z"),
  currentBase: {
    bookings: [
      {
        status: "CONFIRMED",
        paidAmount: 20,
        classSession: {
          startTime: new Date("2026-03-01T12:00:00.000Z"),
          classType: { price: 25 },
        },
      },
    ],
    previousBookings: [],
    classSessions: [
      {
        startTime: new Date("2026-03-01T08:00:00.000Z"),
        capacity: 10,
        classType: { name: "Reformer" },
        bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }],
      },
    ],
    studioClients: [{ createdAt: new Date("2026-03-03T00:00:00.000Z") }],
    newClients: 1,
    previousNewClients: 0,
  },
  previousSessions: [],
})

assert.equal(response.role, "OWNER")
assert.equal(response.metrics.length, 5)
assert.equal(response.series.length, 4)

console.log("Reporting mobile owner runner logic passed")

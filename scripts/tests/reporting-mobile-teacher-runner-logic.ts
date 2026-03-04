import assert from "node:assert/strict"
import { runMobileTeacherReport } from "../../src/lib/reporting/mobile-teacher-report-runner"

const response = runMobileTeacherReport({
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: null,
    currency: "EUR",
  },
  periodDays: 14,
  currentStart: new Date("2026-03-01T00:00:00.000Z"),
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  responseEnd: new Date("2026-03-04T23:59:59.999Z"),
  currentWindow: {
    bookings: [
      {
        status: "COMPLETED",
        clientId: "client_1",
        paidAmount: 30,
        classSession: {
          startTime: new Date("2026-03-01T10:00:00.000Z"),
          classType: { price: 30 },
        },
      },
    ],
    sessions: [
      {
        startTime: new Date("2026-03-01T09:00:00.000Z"),
        capacity: 10,
        classType: { name: "Mat" },
        bookings: [{ status: "COMPLETED" }],
      },
    ],
  },
  previousWindow: {
    bookings: [],
    sessions: [],
  },
})

assert.equal(response.role, "TEACHER")
assert.equal(response.metrics.length, 5)
assert.equal(response.series.length, 4)

console.log("Reporting mobile teacher runner logic passed")

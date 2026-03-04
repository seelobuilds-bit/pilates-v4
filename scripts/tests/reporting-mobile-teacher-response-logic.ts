import assert from "node:assert/strict"
import { buildMobileTeacherReportResponse } from "../../src/lib/reporting/mobile-teacher-report-response"

const response = buildMobileTeacherReportResponse({
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: null,
    currency: "EUR",
  },
  periodDays: 14,
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  rangeStart: new Date("2026-02-20T00:00:00.000Z"),
  rangeEnd: new Date("2026-03-04T23:59:59.999Z"),
  metrics: {
    currentRevenue: 120,
    previousRevenue: 60,
    currentClasses: 6,
    previousClasses: 4,
    currentStudents: 18,
    previousStudents: 12,
    currentFillRate: 75,
    previousFillRate: 60,
    currentCompletionRate: 90,
    previousCompletionRate: 80,
  },
  sessions: [
    {
      classType: { name: "Mat" },
      capacity: 10,
      bookings: [{ status: "COMPLETED" }],
    },
  ],
  series: [],
})

assert.equal(response.role, "TEACHER")
assert.equal(response.metrics.length, 5)
assert.equal(response.highlights[0].label, "Mat")

console.log("Reporting mobile teacher response logic passed")

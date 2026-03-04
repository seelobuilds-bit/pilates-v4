import assert from "node:assert/strict"
import { buildMobileRoleReportResponse } from "../../src/lib/reporting/mobile-report-response"

const payload = buildMobileRoleReportResponse({
  role: "OWNER",
  studio: {
    id: "studio_1",
    name: "Studio",
    subdomain: "studio",
    primaryColor: "#000000",
    currency: "EUR",
  },
  periodDays: 14,
  periodEnd: new Date("2026-03-01T00:00:00.000Z"),
  rangeStart: new Date("2026-02-15T00:00:00.000Z"),
  rangeEnd: new Date("2026-03-02T00:00:00.000Z"),
  metrics: [],
  highlights: [],
  series: [],
})

assert.equal(payload.role, "OWNER")
assert.equal(payload.periodDays, 14)
assert.equal(payload.range.start, "2026-02-15T00:00:00.000Z")
assert.equal(payload.range.end, "2026-03-02T00:00:00.000Z")

console.log("Reporting mobile report response logic passed")

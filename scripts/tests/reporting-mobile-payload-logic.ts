import assert from "node:assert/strict"
import { buildMobileReportsPayload } from "../../src/lib/reporting/mobile-report-payload"

const payload = buildMobileReportsPayload({
  role: "OWNER",
  studio: {
    id: "studio_1",
    name: "Test Studio",
    subdomain: "test",
    primaryColor: "#000",
    currency: "EUR",
  },
  periodDays: 30,
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
  rangeStart: new Date("2026-02-03T00:00:00.000Z"),
  rangeEnd: new Date("2026-03-04T23:59:59.999Z"),
  metrics: [],
  highlights: [{ label: "Top", value: "Value" }],
  series: [],
})

assert.equal(payload.generatedAt, "2026-03-05T00:00:00.000Z")
assert.equal(payload.range.start, "2026-02-03T00:00:00.000Z")
assert.equal(payload.range.end, "2026-03-04T23:59:59.999Z")
assert.equal(payload.role, "OWNER")
assert.equal(payload.highlights[0].label, "Top")

console.log("Reporting mobile payload logic passed")

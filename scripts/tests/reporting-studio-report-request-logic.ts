import assert from "node:assert/strict"
import { resolveStudioReportRangeFromSearchParams } from "../../src/lib/reporting/studio-report-request"

const params = new URLSearchParams({
  days: "14",
  startDate: "2026-02-15",
  endDate: "2026-02-28",
})
const range = resolveStudioReportRangeFromSearchParams(params)

assert.equal(range.days, 14)
assert.equal(range.startDate.toISOString(), "2026-02-15T00:00:00.000Z")
assert.equal(range.reportEndDate.toISOString(), "2026-03-01T00:00:00.000Z")
assert.equal(range.previousStartDate.toISOString(), "2026-02-01T00:00:00.000Z")

console.log("Reporting studio report request logic passed")

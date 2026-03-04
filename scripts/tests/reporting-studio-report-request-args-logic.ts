import assert from "node:assert/strict"
import { buildStudioReportRequestArgs } from "../../src/lib/reporting/studio-report-request-args"

const args = buildStudioReportRequestArgs(
  "studio_123",
  new URLSearchParams({
    days: "21",
    startDate: "2026-02-01",
    endDate: "2026-02-22",
  })
)

assert.equal(args.studioId, "studio_123")
assert.equal(args.days, 22)
assert.equal(args.startDate.toISOString(), "2026-02-01T00:00:00.000Z")
assert.equal(args.reportEndDate.toISOString(), "2026-02-23T00:00:00.000Z")
assert.equal(args.previousStartDate.toISOString(), "2026-01-10T00:00:00.000Z")

console.log("Reporting studio report request args logic passed")

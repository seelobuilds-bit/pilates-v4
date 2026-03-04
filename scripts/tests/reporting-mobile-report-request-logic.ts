import assert from "node:assert/strict"
import {
  resolveMobileReportRangeInputFromBody,
  resolveMobileReportRangeInputFromSearchParams,
} from "../../src/lib/reporting/mobile-report-request"

const fromQuery = resolveMobileReportRangeInputFromSearchParams(
  new URLSearchParams({
    days: "7",
    startDate: "2026-02-01",
    endDate: "2026-02-08",
  })
)
assert.deepEqual(fromQuery, {
  days: "7",
  startDate: "2026-02-01",
  endDate: "2026-02-08",
})

const fromBody = resolveMobileReportRangeInputFromBody({
  days: 30,
  startDate: "2026-01-01",
  endDate: "2026-01-31",
})
assert.deepEqual(fromBody, {
  days: "30",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
})

const fallbackBody = resolveMobileReportRangeInputFromBody(null)
assert.deepEqual(fallbackBody, {
  days: null,
  startDate: null,
  endDate: null,
})

console.log("Reporting mobile report request logic passed")

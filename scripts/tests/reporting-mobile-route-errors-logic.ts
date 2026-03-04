import assert from "node:assert/strict"
import { MobileReportsError } from "../../src/lib/reporting/mobile-report-errors"
import { resolveMobileReportRouteError } from "../../src/lib/reporting/mobile-report-route-errors"

const authError = resolveMobileReportRouteError(new MobileReportsError("Unauthorized", 401))
assert.deepEqual(authError, {
  status: 401,
  message: "Unauthorized",
  log: false,
})

const unknownError = resolveMobileReportRouteError(new Error("boom"))
assert.deepEqual(unknownError, {
  status: 500,
  message: "Failed to load reports",
  log: true,
})

console.log("Reporting mobile route errors logic passed")

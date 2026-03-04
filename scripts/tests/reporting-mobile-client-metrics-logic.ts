import assert from "node:assert/strict"
import { buildMobileClientWindowMetrics } from "../../src/lib/reporting/mobile-client-report-metrics"

const metrics = buildMobileClientWindowMetrics({
  currentBookings: [
    { status: "PENDING" },
    { status: "COMPLETED" },
    { status: "NO_SHOW" },
    { status: "CANCELLED" },
  ],
  previousBookings: [
    { status: "COMPLETED" },
    { status: "CANCELLED" },
  ],
})

assert.deepEqual(metrics, {
  currentBooked: 3,
  previousBooked: 1,
  currentCompleted: 1,
  previousCompleted: 1,
  currentCancelled: 1,
  previousCancelled: 1,
  currentCompletionRate: 33.3,
  previousCompletionRate: 100,
})

console.log("Reporting mobile client metrics logic passed")

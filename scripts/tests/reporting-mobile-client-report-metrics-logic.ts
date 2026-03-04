import assert from "node:assert/strict"
import { buildMobileClientReportMetrics } from "../../src/lib/reporting/mobile-client-report-card-metrics"

const metrics = buildMobileClientReportMetrics({
  currentBooked: 12,
  previousBooked: 10,
  currentCompleted: 9,
  previousCompleted: 8,
  currentCancelled: 3,
  previousCancelled: 2,
  currentCompletionRate: 75,
  previousCompletionRate: 80,
})

assert.deepEqual(
  metrics.map(({ id, label, value, previousValue }) => ({ id, label, value, previousValue })),
  [
    { id: "booked", label: "Booked Classes", value: 12, previousValue: 10 },
    { id: "completed", label: "Completed Classes", value: 9, previousValue: 8 },
    { id: "cancelled", label: "Cancelled", value: 3, previousValue: 2 },
    { id: "completion-rate", label: "Completion Rate", value: 75, previousValue: 80 },
  ]
)

console.log("Reporting mobile client report metrics logic passed")

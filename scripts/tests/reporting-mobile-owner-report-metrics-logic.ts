import assert from "node:assert/strict"
import { buildMobileOwnerReportMetrics } from "../../src/lib/reporting/mobile-owner-report-metrics"

const metrics = buildMobileOwnerReportMetrics({
  currentRevenue: 100,
  previousRevenue: 50,
  currentBooked: 10,
  previousBooked: 8,
  currentClasses: 5,
  previousClasses: 4,
  currentFillRate: 80,
  previousFillRate: 75,
  currentNewClients: 3,
  previousNewClients: 1,
})

assert.deepEqual(
  metrics.map(({ id, label, value, previousValue }) => ({ id, label, value, previousValue })),
  [
    { id: "revenue", label: "Revenue", value: 100, previousValue: 50 },
    { id: "bookings", label: "Bookings", value: 10, previousValue: 8 },
    { id: "classes", label: "Classes", value: 5, previousValue: 4 },
    { id: "fill-rate", label: "Fill Rate", value: 80, previousValue: 75 },
    { id: "new-clients", label: "New Clients", value: 3, previousValue: 1 },
  ]
)

console.log("Reporting mobile owner report metrics logic passed")

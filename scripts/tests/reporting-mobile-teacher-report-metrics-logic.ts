import assert from "node:assert/strict"
import { buildMobileTeacherReportMetrics } from "../../src/lib/reporting/mobile-teacher-report-metrics"

const metrics = buildMobileTeacherReportMetrics({
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
})

assert.deepEqual(
  metrics.map(({ id, label, value, previousValue }) => ({ id, label, value, previousValue })),
  [
    { id: "revenue", label: "Revenue", value: 120, previousValue: 60 },
    { id: "classes", label: "Classes", value: 6, previousValue: 4 },
    { id: "students", label: "Unique Students", value: 18, previousValue: 12 },
    { id: "fill-rate", label: "Fill Rate", value: 75, previousValue: 60 },
    { id: "completion-rate", label: "Completion Rate", value: 90, previousValue: 80 },
  ]
)

console.log("Reporting mobile teacher report metrics logic passed")

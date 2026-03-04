import { buildMobileMetric } from "./mobile-report-metrics"

export function buildMobileTeacherReportMetrics(args: {
  currentRevenue: number
  previousRevenue: number
  currentClasses: number
  previousClasses: number
  currentStudents: number
  previousStudents: number
  currentFillRate: number
  previousFillRate: number
  currentCompletionRate: number
  previousCompletionRate: number
}) {
  return [
    buildMobileMetric("revenue", "Revenue", "currency", args.currentRevenue, args.previousRevenue),
    buildMobileMetric("classes", "Classes", "number", args.currentClasses, args.previousClasses),
    buildMobileMetric("students", "Unique Students", "number", args.currentStudents, args.previousStudents),
    buildMobileMetric("fill-rate", "Fill Rate", "percent", args.currentFillRate, args.previousFillRate),
    buildMobileMetric(
      "completion-rate",
      "Completion Rate",
      "percent",
      args.currentCompletionRate,
      args.previousCompletionRate
    ),
  ]
}

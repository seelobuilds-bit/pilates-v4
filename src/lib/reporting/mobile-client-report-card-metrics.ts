import { buildMobileMetric } from "./mobile-report-metrics"

export function buildMobileClientReportMetrics(args: {
  currentBooked: number
  previousBooked: number
  currentCompleted: number
  previousCompleted: number
  currentCancelled: number
  previousCancelled: number
  currentCompletionRate: number
  previousCompletionRate: number
}) {
  return [
    buildMobileMetric("booked", "Booked Classes", "number", args.currentBooked, args.previousBooked),
    buildMobileMetric("completed", "Completed Classes", "number", args.currentCompleted, args.previousCompleted),
    buildMobileMetric("cancelled", "Cancelled", "number", args.currentCancelled, args.previousCancelled),
    buildMobileMetric(
      "completion-rate",
      "Completion Rate",
      "percent",
      args.currentCompletionRate,
      args.previousCompletionRate
    ),
  ]
}

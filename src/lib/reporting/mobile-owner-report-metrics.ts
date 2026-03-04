import { buildMobileMetric } from "./mobile-report-metrics"

export function buildMobileOwnerReportMetrics(args: {
  currentRevenue: number
  previousRevenue: number
  currentBooked: number
  previousBooked: number
  currentClasses: number
  previousClasses: number
  currentFillRate: number
  previousFillRate: number
  currentNewClients: number
  previousNewClients: number
}) {
  return [
    buildMobileMetric("revenue", "Revenue", "currency", args.currentRevenue, args.previousRevenue),
    buildMobileMetric("bookings", "Bookings", "number", args.currentBooked, args.previousBooked),
    buildMobileMetric("classes", "Classes", "number", args.currentClasses, args.previousClasses),
    buildMobileMetric("fill-rate", "Fill Rate", "percent", args.currentFillRate, args.previousFillRate),
    buildMobileMetric("new-clients", "New Clients", "number", args.currentNewClients, args.previousNewClients),
  ]
}

import { buildReportRangePayload } from "./date-range"

export function buildStudioReportPayload(args: {
  days: number
  startDate: Date
  reportEndDate: Date
  revenue: unknown
  clients: unknown
  instructors: unknown
  retention: unknown
  classes: unknown
  bookings: unknown
  marketing: unknown
  social: unknown
}) {
  return {
    revenue: args.revenue,
    clients: args.clients,
    instructors: args.instructors,
    retention: args.retention,
    classes: args.classes,
    bookings: args.bookings,
    marketing: args.marketing,
    social: args.social,
    range: buildReportRangePayload(args.days, args.startDate, args.reportEndDate),
  }
}

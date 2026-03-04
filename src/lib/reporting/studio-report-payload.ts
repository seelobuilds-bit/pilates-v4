import { buildReportRangePayload } from "./date-range"

export function buildStudioReportPayload<
  Revenue,
  Clients,
  Instructors,
  Retention,
  Classes,
  Bookings,
  Marketing,
  Social,
>(args: {
  days: number
  startDate: Date
  reportEndDate: Date
  revenue: Revenue
  clients: Clients
  instructors: Instructors
  retention: Retention
  classes: Classes
  bookings: Bookings
  marketing: Marketing
  social: Social
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

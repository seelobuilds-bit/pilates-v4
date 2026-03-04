import { buildMobileReportsPayload, type MobileReportsPayload } from "./mobile-report-payload"

export function buildMobileRoleReportResponse(args: {
  role: MobileReportsPayload["role"]
  studio: MobileReportsPayload["studio"]
  periodDays: number
  periodEnd: Date
  rangeStart: Date
  rangeEnd: Date
  metrics: MobileReportsPayload["metrics"]
  highlights: MobileReportsPayload["highlights"]
  series: MobileReportsPayload["series"]
}): MobileReportsPayload {
  return buildMobileReportsPayload({
    role: args.role,
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    metrics: args.metrics,
    highlights: args.highlights,
    series: args.series,
  })
}

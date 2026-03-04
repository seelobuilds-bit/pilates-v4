import { buildClassTypeHighlights } from "./mobile-report-highlights"
import { buildMobileOwnerReportMetrics } from "./mobile-owner-report-metrics"
import { type MobileReportsPayload } from "./mobile-report-payload"
import { buildMobileRoleReportResponse } from "./mobile-report-response"

type StudioSummary = MobileReportsPayload["studio"]

export function buildMobileOwnerReportResponse(args: {
  studio: StudioSummary
  periodDays: number
  periodEnd: Date
  rangeStart: Date
  rangeEnd: Date
  metrics: Parameters<typeof buildMobileOwnerReportMetrics>[0]
  sessions: Parameters<typeof buildClassTypeHighlights>[0]
  series: MobileReportsPayload["series"]
}): MobileReportsPayload {
  return buildMobileRoleReportResponse({
    role: "OWNER",
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    metrics: buildMobileOwnerReportMetrics(args.metrics),
    highlights: buildClassTypeHighlights(args.sessions),
    series: args.series,
  })
}

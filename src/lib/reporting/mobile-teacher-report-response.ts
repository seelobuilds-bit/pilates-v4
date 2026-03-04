import { buildClassTypeHighlights } from "./mobile-report-highlights"
import { type MobileReportsPayload } from "./mobile-report-payload"
import { buildMobileRoleReportResponse } from "./mobile-report-response"
import { buildMobileTeacherReportMetrics } from "./mobile-teacher-report-metrics"

type StudioSummary = MobileReportsPayload["studio"]

export function buildMobileTeacherReportResponse(args: {
  studio: StudioSummary
  periodDays: number
  periodEnd: Date
  rangeStart: Date
  rangeEnd: Date
  metrics: Parameters<typeof buildMobileTeacherReportMetrics>[0]
  sessions: Parameters<typeof buildClassTypeHighlights>[0]
  series: MobileReportsPayload["series"]
}): MobileReportsPayload {
  return buildMobileRoleReportResponse({
    role: "TEACHER",
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    metrics: buildMobileTeacherReportMetrics(args.metrics),
    highlights: buildClassTypeHighlights(args.sessions),
    series: args.series,
  })
}

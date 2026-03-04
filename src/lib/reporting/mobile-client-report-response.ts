import { buildMobileClientHighlights } from "./mobile-client-report-highlights"
import { buildMobileClientReportMetrics } from "./mobile-client-report-card-metrics"
import { type MobileReportsPayload } from "./mobile-report-payload"
import { buildMobileRoleReportResponse } from "./mobile-report-response"

type StudioSummary = MobileReportsPayload["studio"]

export function buildMobileClientReportResponse(args: {
  studio: StudioSummary
  periodDays: number
  periodEnd: Date
  rangeStart: Date
  rangeEnd: Date
  metrics: Parameters<typeof buildMobileClientReportMetrics>[0]
  nextBooking: Parameters<typeof buildMobileClientHighlights>[0]
  series: MobileReportsPayload["series"]
}): MobileReportsPayload {
  return buildMobileRoleReportResponse({
    role: "CLIENT",
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    metrics: buildMobileClientReportMetrics(args.metrics),
    highlights: buildMobileClientHighlights(args.nextBooking),
    series: args.series,
  })
}

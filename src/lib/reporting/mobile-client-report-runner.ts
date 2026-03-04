import { buildMobileClientReportResponse } from "./mobile-client-report-response"
import { buildMobileClientSeries } from "./mobile-client-report-series"
import { buildMobileClientWindowMetrics } from "./mobile-client-report-metrics"
import { type MobileReportsPayload } from "./mobile-report-payload"

type StudioSummary = MobileReportsPayload["studio"]

type ClientBooking = Parameters<typeof buildMobileClientWindowMetrics>[0]["currentBookings"][number] & {
  classSession: { startTime: Date }
}

export function runMobileClientReport(args: {
  studio: StudioSummary
  periodDays: number
  currentStart: Date
  periodEnd: Date
  responseEnd: Date
  currentBookings: ClientBooking[]
  previousBookings: Parameters<typeof buildMobileClientWindowMetrics>[0]["previousBookings"]
  nextBooking: Parameters<typeof buildMobileClientReportResponse>[0]["nextBooking"]
}): MobileReportsPayload {
  const clientMetrics = buildMobileClientWindowMetrics({
    currentBookings: args.currentBookings,
    previousBookings: args.previousBookings,
  })

  const clientSeries = buildMobileClientSeries({
    startDate: args.currentStart,
    endDate: args.periodEnd,
    bookings: args.currentBookings,
  })

  return buildMobileClientReportResponse({
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.currentStart,
    rangeEnd: args.responseEnd,
    metrics: clientMetrics,
    nextBooking: args.nextBooking,
    series: clientSeries,
  })
}

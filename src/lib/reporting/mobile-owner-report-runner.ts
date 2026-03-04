import { buildMobileOwnerReportResponse } from "./mobile-owner-report-response"
import { buildMobileOwnerSeries } from "./mobile-owner-report-series"
import { splitMobileOwnerClientWindows } from "./mobile-owner-client-windows"
import { type MobileReportsPayload } from "./mobile-report-payload"
import { buildStudioOwnerWindowMetrics } from "./studio-owner-window-metrics"

type StudioSummary = MobileReportsPayload["studio"]

type OwnerBooking = {
  status: Parameters<typeof buildStudioOwnerWindowMetrics>[0]["currentBookings"][number]["status"]
  paidAmount: number | null
  classSession: {
    startTime: Date
    classType: {
      price: number
    }
  }
}

type OwnerSession = {
  startTime: Date
  capacity: number
  classType: { name: string }
  bookings: Array<{
    status: Parameters<typeof buildStudioOwnerWindowMetrics>[0]["currentSessions"][number]["bookings"][number]["status"]
  }>
}

type OwnerBaseData = {
  bookings: OwnerBooking[]
  previousBookings: Parameters<typeof buildStudioOwnerWindowMetrics>[0]["previousBookings"]
  classSessions: OwnerSession[]
  studioClients: Array<{ createdAt: Date }>
  newClients: number
}

export function runMobileOwnerReport(args: {
  studio: StudioSummary
  periodDays: number
  currentStart: Date
  previousStart: Date
  periodEnd: Date
  responseEnd: Date
  currentBase: OwnerBaseData
  previousSessions: OwnerSession[]
}): MobileReportsPayload {
  const ownerClientWindows = splitMobileOwnerClientWindows({
    studioClients: args.currentBase.studioClients,
    currentStart: args.currentStart,
    previousStart: args.previousStart,
    periodEnd: args.periodEnd,
  })

  const ownerMetrics = buildStudioOwnerWindowMetrics({
    currentBookings: args.currentBase.bookings,
    previousBookings: args.currentBase.previousBookings,
    currentSessions: args.currentBase.classSessions,
    previousSessions: args.previousSessions,
    currentNewClients: args.currentBase.newClients,
    previousNewClients: ownerClientWindows.previousCount,
    periodEnd: args.periodEnd,
  })

  const ownerSeries = buildMobileOwnerSeries({
    startDate: args.currentStart,
    endDate: args.periodEnd,
    bookings: args.currentBase.bookings,
    sessions: args.currentBase.classSessions,
    newClients: ownerClientWindows.currentRows,
  })

  return buildMobileOwnerReportResponse({
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.currentStart,
    rangeEnd: args.responseEnd,
    metrics: ownerMetrics,
    sessions: args.currentBase.classSessions,
    series: ownerSeries,
  })
}

import { buildMobileTeacherReportResponse } from "./mobile-teacher-report-response"
import { buildMobileTeacherSeries } from "./mobile-teacher-report-series"
import { type MobileReportsPayload } from "./mobile-report-payload"
import { fetchTeacherPerformanceWindow } from "./teacher-performance-query"
import { buildTeacherWindowMetrics } from "./teacher-window-metrics"

type StudioSummary = MobileReportsPayload["studio"]

type TeacherWindow = {
  bookings: Awaited<ReturnType<typeof fetchTeacherPerformanceWindow>>["bookings"]
  sessions: Awaited<ReturnType<typeof fetchTeacherPerformanceWindow>>["sessions"]
}

export function runMobileTeacherReport(args: {
  studio: StudioSummary
  periodDays: number
  currentStart: Date
  periodEnd: Date
  responseEnd: Date
  currentWindow: TeacherWindow
  previousWindow: TeacherWindow
}): MobileReportsPayload {
  const teacherMetrics = buildTeacherWindowMetrics({
    currentSessions: args.currentWindow.sessions,
    previousSessions: args.previousWindow.sessions,
    currentBookings: args.currentWindow.bookings,
    previousBookings: args.previousWindow.bookings,
    decimals: 1,
  })

  const teacherSeries = buildMobileTeacherSeries({
    startDate: args.currentStart,
    endDate: args.periodEnd,
    bookings: args.currentWindow.bookings,
    sessions: args.currentWindow.sessions,
  })

  return buildMobileTeacherReportResponse({
    studio: args.studio,
    periodDays: args.periodDays,
    periodEnd: args.periodEnd,
    rangeStart: args.currentStart,
    rangeEnd: args.responseEnd,
    metrics: teacherMetrics,
    sessions: args.currentWindow.sessions,
    series: teacherSeries,
  })
}

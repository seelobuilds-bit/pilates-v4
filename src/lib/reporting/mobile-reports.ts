import { assertMobileReportsAuth } from "@/lib/reporting/mobile-report-auth"
import { buildMobileClientReportResponse } from "@/lib/reporting/mobile-client-report-response"
import { fetchTeacherPerformanceWindow } from "@/lib/reporting/teacher-performance-query"
import { buildMobileClientWindowMetrics } from "@/lib/reporting/mobile-client-report-metrics"
import { buildMobileClientSeries } from "@/lib/reporting/mobile-client-report-series"
import { type MobileReportsPayload } from "@/lib/reporting/mobile-report-payload"
import { splitMobileOwnerClientWindows } from "@/lib/reporting/mobile-owner-client-windows"
import { buildMobileOwnerReportResponse } from "@/lib/reporting/mobile-owner-report-response"
import { buildMobileOwnerSeries } from "@/lib/reporting/mobile-owner-report-series"
import { buildMobileTeacherReportResponse } from "@/lib/reporting/mobile-teacher-report-response"
import { buildMobileTeacherSeries } from "@/lib/reporting/mobile-teacher-report-series"
import {
  resolveMobileClientReportId,
  resolveMobileTeacherReportId,
} from "@/lib/reporting/mobile-report-role-context"
import { buildTeacherWindowMetrics } from "@/lib/reporting/teacher-window-metrics"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { resolveDefaultMobileReportRange, type ReportRangeInput } from "@/lib/reporting/date-range"
import {
  fetchStudioReportBaseData,
  fetchStudioReportClassSessionsWindow,
} from "@/lib/reporting/studio-report-base-query"
import { buildStudioOwnerWindowMetrics } from "@/lib/reporting/studio-owner-window-metrics"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

export async function getMobileReports(
  authorizationHeader: string | null,
  input: ReportRangeInput
): Promise<MobileReportsPayload> {
  const auth = await resolveMobileStudioAuthContext(authorizationHeader)
  assertMobileReportsAuth(auth)

  const decoded = auth.decoded
  const studio = auth.studio
  const studioSummary = toMobileStudioSummary(studio)

  const {
    days: periodDays,
    reportEndDate: periodEnd,
    startDate: currentStart,
    previousStartDate: previousStart,
    responseEndDate: responseEnd,
  } = resolveDefaultMobileReportRange(input)

  if (decoded.role === "OWNER") {
    const [currentBase, previousSessions] = await Promise.all([
      fetchStudioReportBaseData({
        studioId: studio.id,
        startDate: currentStart,
        reportEndDate: periodEnd,
        previousStartDate: previousStart,
      }),
      fetchStudioReportClassSessionsWindow({
        studioId: studio.id,
        startDate: previousStart,
        endDate: currentStart,
      }),
    ])

    const currentBookings = currentBase.bookings
    const previousBookings = currentBase.previousBookings
    const currentSessions = currentBase.classSessions
    const ownerClientWindows = splitMobileOwnerClientWindows({
      studioClients: currentBase.studioClients,
      currentStart,
      previousStart,
      periodEnd,
    })

    const ownerMetrics = buildStudioOwnerWindowMetrics({
      currentBookings,
      previousBookings,
      currentSessions,
      previousSessions,
      currentNewClients: currentBase.newClients,
      previousNewClients: ownerClientWindows.previousCount,
      periodEnd,
    })

    const ownerSeries = buildMobileOwnerSeries({
      startDate: currentStart,
      endDate: periodEnd,
      bookings: currentBookings,
      sessions: currentSessions,
      newClients: ownerClientWindows.currentRows,
    })

    return buildMobileOwnerReportResponse({
      studio: studioSummary,
      periodDays,
      periodEnd,
      rangeStart: currentStart,
      rangeEnd: responseEnd,
      metrics: ownerMetrics,
      sessions: currentSessions,
      series: ownerSeries,
    })
  }

  if (decoded.role === "TEACHER") {
    const teacherId = resolveMobileTeacherReportId(decoded)

    const [currentWindow, previousWindow] = await Promise.all([
      fetchTeacherPerformanceWindow({
        studioId: studio.id,
        teacherId,
        startDate: currentStart,
        endDate: periodEnd,
      }),
      fetchTeacherPerformanceWindow({
        studioId: studio.id,
        teacherId,
        startDate: previousStart,
        endDate: currentStart,
      }),
    ])

    const currentBookings = currentWindow.bookings
    const previousBookings = previousWindow.bookings
    const currentSessions = currentWindow.sessions
    const previousSessions = previousWindow.sessions

    const teacherMetrics = buildTeacherWindowMetrics({
      currentSessions,
      previousSessions,
      currentBookings,
      previousBookings,
      decimals: 1,
    })

    const teacherSeries = buildMobileTeacherSeries({
      startDate: currentStart,
      endDate: periodEnd,
      bookings: currentBookings,
      sessions: currentSessions,
    })

    return buildMobileTeacherReportResponse({
      studio: studioSummary,
      periodDays,
      periodEnd,
      rangeStart: currentStart,
      rangeEnd: responseEnd,
      metrics: teacherMetrics,
      sessions: currentSessions,
      series: teacherSeries,
    })
  }

  const clientId = resolveMobileClientReportId(decoded)

  const [currentBookings, previousBookings, nextBooking] = await Promise.all([
    db.booking.findMany({
      where: {
        studioId: studio.id,
        clientId,
        classSession: {
          startTime: { gte: currentStart, lt: periodEnd },
        },
      },
      select: {
        status: true,
        classSession: {
          select: {
            startTime: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        studioId: studio.id,
        clientId,
        classSession: {
          startTime: { gte: previousStart, lt: currentStart },
        },
      },
      select: {
        status: true,
      },
    }),
    db.booking.findFirst({
      where: {
        studioId: studio.id,
        clientId,
        classSession: {
          startTime: { gte: periodEnd },
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        classSession: {
          select: {
            startTime: true,
            classType: { select: { name: true } },
          },
        },
      },
      orderBy: {
        classSession: { startTime: "asc" },
      },
    }),
  ])

  const clientMetrics = buildMobileClientWindowMetrics({
    currentBookings,
    previousBookings,
  })

  const clientSeries = buildMobileClientSeries({
    startDate: currentStart,
    endDate: periodEnd,
    bookings: currentBookings,
  })

  return buildMobileClientReportResponse({
    studio: studioSummary,
    periodDays,
    periodEnd,
    rangeStart: currentStart,
    rangeEnd: responseEnd,
    metrics: clientMetrics,
    nextBooking,
    series: clientSeries,
  })
}

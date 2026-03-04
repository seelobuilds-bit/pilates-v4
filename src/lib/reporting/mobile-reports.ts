import { buildMobileClientReportMetrics } from "@/lib/reporting/mobile-client-report-card-metrics"
import { fetchTeacherPerformanceWindow } from "@/lib/reporting/teacher-performance-query"
import { buildMobileClientWindowMetrics } from "@/lib/reporting/mobile-client-report-metrics"
import { buildMobileClientSeries } from "@/lib/reporting/mobile-client-report-series"
import { buildClassTypeHighlights } from "@/lib/reporting/mobile-report-highlights"
import { type MobileReportMetric } from "@/lib/reporting/mobile-report-metrics"
import { buildMobileOwnerReportMetrics } from "@/lib/reporting/mobile-owner-report-metrics"
import { buildMobileOwnerSeries } from "@/lib/reporting/mobile-owner-report-series"
import { buildMobileTeacherReportMetrics } from "@/lib/reporting/mobile-teacher-report-metrics"
import { buildMobileTeacherSeries } from "@/lib/reporting/mobile-teacher-report-series"
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
export type MobileReportsPayload = {
  role: "OWNER" | "TEACHER" | "CLIENT"
  studio: {
    id: string
    name: string
    subdomain: string
    primaryColor: string | null
    currency: string | null
  }
  periodDays: number
  generatedAt: string
  range: {
    start: string
    end: string
  }
  metrics: MobileReportMetric[]
  highlights: Array<{ label: string; value: string }>
  series: Array<{
    label: string
    start: string
    end: string
    metrics: Record<string, number>
  }>
}

export class MobileReportsError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MobileReportsError"
    this.status = status
  }
}

export async function getMobileReports(
  authorizationHeader: string | null,
  input: ReportRangeInput
): Promise<MobileReportsPayload> {
  const auth = await resolveMobileStudioAuthContext(authorizationHeader)
  if (!auth.ok) {
    if (auth.reason === "missing_token") {
      throw new MobileReportsError("Missing bearer token", 401)
    }
    if (auth.reason === "invalid_token") {
      throw new MobileReportsError("Invalid token", 401)
    }
    throw new MobileReportsError("Studio not found", 401)
  }

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
    const currentNewClientRows = currentBase.studioClients.filter(
      (client) => client.createdAt >= currentStart && client.createdAt < periodEnd
    )
    const previousNewClients = currentBase.studioClients.filter(
      (client) => client.createdAt >= previousStart && client.createdAt < currentStart
    ).length

    const ownerMetrics = buildStudioOwnerWindowMetrics({
      currentBookings,
      previousBookings,
      currentSessions,
      previousSessions,
      currentNewClients: currentBase.newClients,
      previousNewClients,
      periodEnd,
    })

    const ownerSeries = buildMobileOwnerSeries({
      startDate: currentStart,
      endDate: periodEnd,
      bookings: currentBookings,
      sessions: currentSessions,
      newClients: currentNewClientRows,
    })

    return {
      role: "OWNER",
      studio: studioSummary,
      periodDays,
      generatedAt: periodEnd.toISOString(),
      range: {
        start: currentStart.toISOString(),
        end: responseEnd.toISOString(),
      },
      metrics: buildMobileOwnerReportMetrics(ownerMetrics),
      highlights: buildClassTypeHighlights(currentSessions),
      series: ownerSeries,
    }
  }

  if (decoded.role === "TEACHER") {
    if (!decoded.teacherId) {
      throw new MobileReportsError("Teacher session invalid", 401)
    }

    const [currentWindow, previousWindow] = await Promise.all([
      fetchTeacherPerformanceWindow({
        studioId: studio.id,
        teacherId: decoded.teacherId,
        startDate: currentStart,
        endDate: periodEnd,
      }),
      fetchTeacherPerformanceWindow({
        studioId: studio.id,
        teacherId: decoded.teacherId,
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

    return {
      role: "TEACHER",
      studio: studioSummary,
      periodDays,
      generatedAt: periodEnd.toISOString(),
      range: {
        start: currentStart.toISOString(),
        end: responseEnd.toISOString(),
      },
      metrics: buildMobileTeacherReportMetrics(teacherMetrics),
      highlights: buildClassTypeHighlights(currentSessions),
      series: teacherSeries,
    }
  }

  const clientId = decoded.clientId || decoded.sub

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

  return {
    role: "CLIENT",
    studio: studioSummary,
    periodDays,
    generatedAt: periodEnd.toISOString(),
    range: {
      start: currentStart.toISOString(),
      end: responseEnd.toISOString(),
    },
    metrics: buildMobileClientReportMetrics(clientMetrics),
    highlights: nextBooking
      ? [
          {
            label: "Next class",
            value: `${nextBooking.classSession.classType.name} · ${new Date(nextBooking.classSession.startTime).toLocaleString()}`,
          },
        ]
      : [{ label: "Next class", value: "No upcoming bookings yet" }],
    series: clientSeries,
  }
}

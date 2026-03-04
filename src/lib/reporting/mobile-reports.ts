import { assertMobileReportsAuth } from "@/lib/reporting/mobile-report-auth"
import { runMobileClientReport } from "@/lib/reporting/mobile-client-report-runner"
import { fetchTeacherPerformanceWindow } from "@/lib/reporting/teacher-performance-query"
import { type MobileReportsPayload } from "@/lib/reporting/mobile-report-payload"
import { runMobileOwnerReport } from "@/lib/reporting/mobile-owner-report-runner"
import { runMobileTeacherReport } from "@/lib/reporting/mobile-teacher-report-runner"
import {
  resolveMobileClientReportId,
  resolveMobileTeacherReportId,
} from "@/lib/reporting/mobile-report-role-context"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { resolveDefaultMobileReportRange, type ReportRangeInput } from "@/lib/reporting/date-range"
import {
  fetchStudioReportBaseData,
  fetchStudioReportClassSessionsWindow,
} from "@/lib/reporting/studio-report-base-query"
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

    return runMobileOwnerReport({
      studio: studioSummary,
      periodDays,
      currentStart,
      previousStart,
      periodEnd,
      responseEnd,
      currentBase,
      previousSessions,
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

    return runMobileTeacherReport({
      studio: studioSummary,
      periodDays,
      currentStart,
      periodEnd,
      responseEnd,
      currentWindow,
      previousWindow,
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

  return runMobileClientReport({
    studio: studioSummary,
    periodDays,
    currentStart,
    periodEnd,
    responseEnd,
    currentBookings,
    previousBookings,
    nextBooking,
  })
}

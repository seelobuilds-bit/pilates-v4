import { BookingStatus } from "@prisma/client"
import {
  countAttendedBookings,
} from "@/lib/reporting/attendance"
import { fetchTeacherPerformanceWindow } from "@/lib/reporting/teacher-performance-query"
import { buildTeacherWindowMetrics } from "@/lib/reporting/teacher-window-metrics"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { resolveDefaultMobileReportRange, type ReportRangeInput } from "@/lib/reporting/date-range"
import { ratioPercentage, roundCurrency, roundTo } from "@/lib/reporting/metrics"
import { resolveBookingRevenue } from "@/lib/reporting/revenue"
import {
  fetchStudioReportBaseData,
  fetchStudioReportClassSessionsWindow,
} from "@/lib/reporting/studio-report-base-query"
import { buildStudioOwnerWindowMetrics } from "@/lib/reporting/studio-owner-window-metrics"
import { toMobileStudioSummary } from "@/lib/studio-read-models"
import { bucketIndexForDate, buildTrendBuckets } from "@/lib/reporting/trend-series"
const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

export type MobileMetricFormat = "number" | "currency" | "percent"

export type MobileReportMetric = {
  id: string
  label: string
  value: number
  previousValue: number
  changePct: number
  format: MobileMetricFormat
}

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

function calcChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return roundTo(((current - previous) / previous) * 100, 1)
}

function bookingRevenue(booking: { paidAmount: number | null; classSession: { classType: { price: number } } }) {
  return resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
}

function metric(id: string, label: string, format: MobileMetricFormat, value: number, previousValue: number): MobileReportMetric {
  return {
    id,
    label,
    value,
    previousValue,
    changePct: calcChange(value, previousValue),
    format,
  }
}

function classTypeHighlights(
  sessions: Array<{
    classType: { name: string }
    capacity: number
    bookings: Array<{ status: BookingStatus }>
  }>
) {
  const byType = new Map<string, { sessions: number; capacity: number; attended: number }>()

  for (const session of sessions) {
    const key = session.classType.name
    const current = byType.get(key) || { sessions: 0, capacity: 0, attended: 0 }
    current.sessions += 1
    current.capacity += session.capacity
    current.attended += countAttendedBookings(session.bookings)
    byType.set(key, current)
  }

  return Array.from(byType.entries())
    .map(([name, value]) => ({
      label: name,
      value: `${value.sessions} classes · ${ratioPercentage(value.attended, value.capacity, 0)}% fill`,
      sessions: value.sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 3)
    .map(({ label, value }) => ({ label, value }))
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

    const ownerBuckets = buildTrendBuckets(currentStart, periodEnd)
    const ownerSeries = ownerBuckets.map((bucket) => ({
      label: bucket.label,
      start: bucket.start.toISOString(),
      end: bucket.end.toISOString(),
      metrics: {
        revenue: 0,
        bookings: 0,
        classes: 0,
        "fill-rate": 0,
        "new-clients": 0,
      },
    }))
    const ownerCapacityByBucket = ownerBuckets.map(() => 0)
    const ownerAttendedByBucket = ownerBuckets.map(() => 0)

    for (const booking of currentBookings) {
      if (!NON_CANCELLED_STATUSES.has(booking.status)) continue
      const index = bucketIndexForDate(booking.classSession.startTime, ownerBuckets)
      if (index < 0) continue
      ownerSeries[index].metrics.bookings += 1
      ownerSeries[index].metrics.revenue = roundCurrency(ownerSeries[index].metrics.revenue + bookingRevenue(booking))
    }

    for (const session of currentSessions) {
      const index = bucketIndexForDate(session.startTime, ownerBuckets)
      if (index < 0) continue
      ownerSeries[index].metrics.classes += 1
      ownerCapacityByBucket[index] += session.capacity
      ownerAttendedByBucket[index] += countAttendedBookings(session.bookings)
    }

    for (const client of currentNewClientRows) {
      const index = bucketIndexForDate(client.createdAt, ownerBuckets)
      if (index < 0) continue
      ownerSeries[index].metrics["new-clients"] += 1
    }

    ownerSeries.forEach((point, index) => {
      point.metrics["fill-rate"] = ratioPercentage(ownerAttendedByBucket[index], ownerCapacityByBucket[index], 1)
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
      metrics: [
        metric("revenue", "Revenue", "currency", ownerMetrics.currentRevenue, ownerMetrics.previousRevenue),
        metric("bookings", "Bookings", "number", ownerMetrics.currentBooked, ownerMetrics.previousBooked),
        metric("classes", "Classes", "number", ownerMetrics.currentClasses, ownerMetrics.previousClasses),
        metric("fill-rate", "Fill Rate", "percent", ownerMetrics.currentFillRate, ownerMetrics.previousFillRate),
        metric("new-clients", "New Clients", "number", ownerMetrics.currentNewClients, ownerMetrics.previousNewClients),
      ],
      highlights: classTypeHighlights(currentSessions),
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

    const teacherBuckets = buildTrendBuckets(currentStart, periodEnd)
    const teacherSeries = teacherBuckets.map((bucket) => ({
      label: bucket.label,
      start: bucket.start.toISOString(),
      end: bucket.end.toISOString(),
      metrics: {
        revenue: 0,
        classes: 0,
        students: 0,
        "fill-rate": 0,
        "completion-rate": 0,
      },
    }))
    const teacherCapacityByBucket = teacherBuckets.map(() => 0)
    const teacherAttendedByBucket = teacherBuckets.map(() => 0)
    const teacherCompletedByBucket = teacherBuckets.map(() => 0)
    const teacherNonCancelledByBucket = teacherBuckets.map(() => 0)
    const teacherStudentsByBucket = teacherBuckets.map(() => new Set<string>())

    for (const booking of currentBookings) {
      if (!NON_CANCELLED_STATUSES.has(booking.status)) continue
      const index = bucketIndexForDate(booking.classSession.startTime, teacherBuckets)
      if (index < 0) continue
      teacherNonCancelledByBucket[index] += 1
      teacherSeries[index].metrics.revenue = roundCurrency(teacherSeries[index].metrics.revenue + bookingRevenue(booking))
      teacherStudentsByBucket[index].add(booking.clientId)
      if (booking.status === "COMPLETED") {
        teacherCompletedByBucket[index] += 1
      }
    }

    for (const session of currentSessions) {
      const index = bucketIndexForDate(session.startTime, teacherBuckets)
      if (index < 0) continue
      teacherSeries[index].metrics.classes += 1
      teacherCapacityByBucket[index] += session.capacity
      teacherAttendedByBucket[index] += countAttendedBookings(session.bookings)
    }

    teacherSeries.forEach((point, index) => {
      point.metrics.students = teacherStudentsByBucket[index].size
      point.metrics["fill-rate"] = ratioPercentage(teacherAttendedByBucket[index], teacherCapacityByBucket[index], 1)
      point.metrics["completion-rate"] = ratioPercentage(teacherCompletedByBucket[index], teacherNonCancelledByBucket[index], 1)
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
      metrics: [
        metric("revenue", "Revenue", "currency", teacherMetrics.currentRevenue, teacherMetrics.previousRevenue),
        metric("classes", "Classes", "number", teacherMetrics.currentClasses, teacherMetrics.previousClasses),
        metric("students", "Unique Students", "number", teacherMetrics.currentStudents, teacherMetrics.previousStudents),
        metric("fill-rate", "Fill Rate", "percent", teacherMetrics.currentFillRate, teacherMetrics.previousFillRate),
        metric(
          "completion-rate",
          "Completion Rate",
          "percent",
          teacherMetrics.currentCompletionRate,
          teacherMetrics.previousCompletionRate
        ),
      ],
      highlights: classTypeHighlights(currentSessions),
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

  const currentNonCancelled = currentBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))
  const previousNonCancelled = previousBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))

  const currentCompleted = currentBookings.filter((booking) => booking.status === "COMPLETED").length
  const previousCompleted = previousBookings.filter((booking) => booking.status === "COMPLETED").length
  const currentCancelled = currentBookings.filter((booking) => booking.status === "CANCELLED").length
  const previousCancelled = previousBookings.filter((booking) => booking.status === "CANCELLED").length

  const clientBuckets = buildTrendBuckets(currentStart, periodEnd)
  const clientSeries = clientBuckets.map((bucket) => ({
    label: bucket.label,
    start: bucket.start.toISOString(),
    end: bucket.end.toISOString(),
    metrics: {
      booked: 0,
      completed: 0,
      cancelled: 0,
      "completion-rate": 0,
    },
  }))
  const clientCompletedByBucket = clientBuckets.map(() => 0)
  const clientBookedByBucket = clientBuckets.map(() => 0)

  for (const booking of currentBookings) {
    const index = bucketIndexForDate(booking.classSession.startTime, clientBuckets)
    if (index < 0) continue

    if (NON_CANCELLED_STATUSES.has(booking.status)) {
      clientBookedByBucket[index] += 1
      clientSeries[index].metrics.booked += 1
    }

    if (booking.status === "COMPLETED") {
      clientCompletedByBucket[index] += 1
      clientSeries[index].metrics.completed += 1
    }

    if (booking.status === "CANCELLED") {
      clientSeries[index].metrics.cancelled += 1
    }
  }

  clientSeries.forEach((point, index) => {
    point.metrics["completion-rate"] = ratioPercentage(clientCompletedByBucket[index], clientBookedByBucket[index], 1)
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
    metrics: [
      metric("booked", "Booked Classes", "number", currentNonCancelled.length, previousNonCancelled.length),
      metric("completed", "Completed Classes", "number", currentCompleted, previousCompleted),
      metric("cancelled", "Cancelled", "number", currentCancelled, previousCancelled),
      metric(
        "completion-rate",
        "Completion Rate",
        "percent",
        ratioPercentage(currentCompleted, currentNonCancelled.length, 1),
        ratioPercentage(previousCompleted, previousNonCancelled.length, 1)
      ),
    ],
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

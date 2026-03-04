import { BookingStatus } from "@prisma/client"
import {
  countAttendedBookings,
} from "@/lib/reporting/attendance"
import { buildTeacherPerformanceSummary } from "@/lib/reporting/teacher-performance"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { resolveReportRange, type ReportRangeInput } from "@/lib/reporting/date-range"
import { ratioPercentage, roundCurrency, roundTo } from "@/lib/reporting/metrics"
import { resolveBookingRevenue } from "@/lib/reporting/revenue"

const DAY_IN_MS = 1000 * 60 * 60 * 24
const ALLOWED_DAYS = new Set([7, 30, 90])
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

function buildTrendBuckets(start: Date, end: Date, maxBuckets = 8) {
  const totalMs = Math.max(1, end.getTime() - start.getTime())
  const totalDays = Math.max(1, Math.ceil(totalMs / DAY_IN_MS))
  const bucketCount = Math.max(1, Math.min(maxBuckets, totalDays))
  const bucketMs = Math.max(1, Math.ceil(totalMs / bucketCount))

  const buckets: Array<{ start: Date; end: Date; label: string }> = []
  let cursor = start.getTime()

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketStart = new Date(cursor)
    const bucketEnd = new Date(index === bucketCount - 1 ? end.getTime() : Math.min(end.getTime(), cursor + bucketMs))
    const label = bucketStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    buckets.push({ start: bucketStart, end: bucketEnd, label })
    cursor = bucketEnd.getTime()
  }

  return buckets
}

function bucketIndexForDate(value: Date, buckets: Array<{ start: Date; end: Date }>) {
  const timestamp = value.getTime()
  for (let index = 0; index < buckets.length; index += 1) {
    const bucket = buckets[index]
    if (timestamp >= bucket.start.getTime() && timestamp < bucket.end.getTime()) {
      return index
    }
  }
  return -1
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
  const token = extractBearerToken(authorizationHeader)
  if (!token) {
    throw new MobileReportsError("Missing bearer token", 401)
  }

  const decoded = verifyMobileToken(token)
  if (!decoded) {
    throw new MobileReportsError("Invalid token", 401)
  }

  const studio = await db.studio.findUnique({
    where: { id: decoded.studioId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      primaryColor: true,
      stripeCurrency: true,
    },
  })

  if (!studio || studio.subdomain !== decoded.studioSubdomain) {
    throw new MobileReportsError("Studio not found", 401)
  }

  const studioSummary = {
    id: studio.id,
    name: studio.name,
    subdomain: studio.subdomain,
    primaryColor: studio.primaryColor,
    currency: studio.stripeCurrency,
  }

  const {
    days: periodDays,
    reportEndDate: periodEnd,
    startDate: currentStart,
    previousStartDate: previousStart,
    responseEndDate: responseEnd,
  } = resolveReportRange(input, {
    defaultDays: 30,
    allowedDays: Array.from(ALLOWED_DAYS),
  })

  if (decoded.role === "OWNER") {
    const [currentBookings, previousBookings, currentSessions, previousSessions, currentNewClientRows, previousNewClients] = await Promise.all([
      db.booking.findMany({
        where: {
          studioId: studio.id,
          classSession: {
            startTime: { gte: currentStart, lt: periodEnd },
          },
        },
        select: {
          status: true,
          paidAmount: true,
          classSession: {
            select: {
              startTime: true,
              classType: { select: { price: true } },
            },
          },
        },
      }),
      db.booking.findMany({
        where: {
          studioId: studio.id,
          classSession: {
            startTime: { gte: previousStart, lt: currentStart },
          },
        },
        select: {
          status: true,
          paidAmount: true,
          classSession: {
            select: {
              startTime: true,
              classType: { select: { price: true } },
            },
          },
        },
      }),
      db.classSession.findMany({
        where: {
          studioId: studio.id,
          startTime: { gte: currentStart, lt: periodEnd },
        },
        select: {
          startTime: true,
          capacity: true,
          classType: { select: { name: true } },
          bookings: { select: { status: true } },
        },
      }),
      db.classSession.findMany({
        where: {
          studioId: studio.id,
          startTime: { gte: previousStart, lt: currentStart },
        },
        select: {
          capacity: true,
          classType: { select: { name: true } },
          bookings: { select: { status: true } },
        },
      }),
      db.client.findMany({
        where: {
          studioId: studio.id,
          createdAt: { gte: currentStart, lt: periodEnd },
        },
        select: {
          createdAt: true,
        },
      }),
      db.client.count({
        where: {
          studioId: studio.id,
          createdAt: { gte: previousStart, lt: currentStart },
        },
      }),
    ])

    const currentRevenue = roundCurrency(
      currentBookings
        .filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))
        .reduce((sum, booking) => sum + bookingRevenue(booking), 0)
    )
    const previousRevenue = roundCurrency(
      previousBookings
        .filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))
        .reduce((sum, booking) => sum + bookingRevenue(booking), 0)
    )

    const currentBooked = currentBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length
    const previousBooked = previousBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length

    const currentCapacity = currentSessions.reduce((sum, session) => sum + session.capacity, 0)
    const previousCapacity = previousSessions.reduce((sum, session) => sum + session.capacity, 0)
    const currentAttended = currentSessions.reduce(
      (sum, session) => sum + countAttendedBookings(session.bookings),
      0
    )
    const previousAttended = previousSessions.reduce(
      (sum, session) => sum + countAttendedBookings(session.bookings),
      0
    )
    const currentNewClients = currentNewClientRows.length

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
        metric("revenue", "Revenue", "currency", currentRevenue, previousRevenue),
        metric("bookings", "Bookings", "number", currentBooked, previousBooked),
        metric("classes", "Classes", "number", currentSessions.length, previousSessions.length),
        metric("fill-rate", "Fill Rate", "percent", ratioPercentage(currentAttended, currentCapacity, 1), ratioPercentage(previousAttended, previousCapacity, 1)),
        metric("new-clients", "New Clients", "number", currentNewClients, previousNewClients),
      ],
      highlights: classTypeHighlights(currentSessions),
      series: ownerSeries,
    }
  }

  if (decoded.role === "TEACHER") {
    if (!decoded.teacherId) {
      throw new MobileReportsError("Teacher session invalid", 401)
    }

    const [currentBookings, previousBookings, currentSessions, previousSessions] = await Promise.all([
      db.booking.findMany({
        where: {
          studioId: studio.id,
          classSession: {
            teacherId: decoded.teacherId,
            startTime: { gte: currentStart, lt: periodEnd },
          },
        },
        select: {
          status: true,
          clientId: true,
          paidAmount: true,
          classSession: {
            select: {
              startTime: true,
              classType: { select: { price: true } },
            },
          },
        },
      }),
      db.booking.findMany({
        where: {
          studioId: studio.id,
          classSession: {
            teacherId: decoded.teacherId,
            startTime: { gte: previousStart, lt: currentStart },
          },
        },
        select: {
          status: true,
          clientId: true,
          paidAmount: true,
          classSession: {
            select: {
              startTime: true,
              classType: { select: { price: true } },
            },
          },
        },
      }),
      db.classSession.findMany({
        where: {
          studioId: studio.id,
          teacherId: decoded.teacherId,
          startTime: { gte: currentStart, lt: periodEnd },
        },
        select: {
          startTime: true,
          capacity: true,
          classType: { select: { name: true } },
          bookings: { select: { status: true } },
        },
      }),
      db.classSession.findMany({
        where: {
          studioId: studio.id,
          teacherId: decoded.teacherId,
          startTime: { gte: previousStart, lt: currentStart },
        },
        select: {
          capacity: true,
          classType: { select: { name: true } },
          bookings: { select: { status: true } },
        },
      }),
    ])

    const currentPerformance = buildTeacherPerformanceSummary(currentSessions, currentBookings, 1)
    const previousPerformance = buildTeacherPerformanceSummary(previousSessions, previousBookings, 1)

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
        metric("revenue", "Revenue", "currency", currentPerformance.revenue, previousPerformance.revenue),
        metric("classes", "Classes", "number", currentPerformance.totalClasses, previousPerformance.totalClasses),
        metric("students", "Unique Students", "number", currentPerformance.totalStudents, previousPerformance.totalStudents),
        metric("fill-rate", "Fill Rate", "percent", currentPerformance.avgFillRate, previousPerformance.avgFillRate),
        metric(
          "completion-rate",
          "Completion Rate",
          "percent",
          currentPerformance.completionRate,
          previousPerformance.completionRate
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

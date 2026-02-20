import { BookingStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ratioPercentage, roundCurrency, roundTo } from "@/lib/reporting/metrics"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const ALLOWED_DAYS = new Set([7, 30, 90])
const ATTENDED_STATUSES = new Set<BookingStatus>(["CONFIRMED", "COMPLETED", "NO_SHOW"])
const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type MobileMetricFormat = "number" | "currency" | "percent"

type MobileReportMetric = {
  id: string
  label: string
  value: number
  previousValue: number
  changePct: number
  format: MobileMetricFormat
}

function parseDays(value: string | null) {
  const parsed = Number(value)
  return ALLOWED_DAYS.has(parsed) ? parsed : 30
}

function subtractDays(date: Date, days: number) {
  const clone = new Date(date)
  clone.setDate(clone.getDate() - days)
  return clone
}

function calcChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return roundTo(((current - previous) / previous) * 100, 1)
}

function bookingRevenue(booking: { paidAmount: number | null; classSession: { classType: { price: number } } }) {
  return booking.paidAmount ?? booking.classSession.classType.price ?? 0
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
  const totalDays = Math.max(1, Math.ceil(totalMs / (24 * 60 * 60 * 1000)))
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
    current.attended += session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length
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

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
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
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const periodDays = parseDays(request.nextUrl.searchParams.get("days"))
    const periodEnd = new Date()
    const currentStart = subtractDays(periodEnd, periodDays)
    const previousStart = subtractDays(currentStart, periodDays)

    if (decoded.role === "OWNER") {
      const [currentBookings, previousBookings, currentSessions, previousSessions, currentNewClientRows, previousNewClients] = await Promise.all([
        db.booking.findMany({
          where: {
            studioId: studio.id,
            createdAt: { gte: currentStart, lt: periodEnd },
          },
          select: {
            createdAt: true,
            status: true,
            paidAmount: true,
            classSession: { select: { classType: { select: { price: true } } } },
          },
        }),
        db.booking.findMany({
          where: {
            studioId: studio.id,
            createdAt: { gte: previousStart, lt: currentStart },
          },
          select: {
            status: true,
            paidAmount: true,
            classSession: { select: { classType: { select: { price: true } } } },
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
        (sum, session) => sum + session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length,
        0
      )
      const previousAttended = previousSessions.reduce(
        (sum, session) => sum + session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length,
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
        const index = bucketIndexForDate(booking.createdAt, ownerBuckets)
        if (index < 0) continue
        ownerSeries[index].metrics.bookings += 1
        ownerSeries[index].metrics.revenue = roundCurrency(ownerSeries[index].metrics.revenue + bookingRevenue(booking))
      }

      for (const session of currentSessions) {
        const index = bucketIndexForDate(session.startTime, ownerBuckets)
        if (index < 0) continue
        ownerSeries[index].metrics.classes += 1
        ownerCapacityByBucket[index] += session.capacity
        ownerAttendedByBucket[index] += session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length
      }

      for (const client of currentNewClientRows) {
        const index = bucketIndexForDate(client.createdAt, ownerBuckets)
        if (index < 0) continue
        ownerSeries[index].metrics["new-clients"] += 1
      }

      ownerSeries.forEach((point, index) => {
        point.metrics["fill-rate"] = ratioPercentage(ownerAttendedByBucket[index], ownerCapacityByBucket[index], 1)
      })

      return NextResponse.json({
        role: "OWNER",
        studio: studioSummary,
        periodDays,
        generatedAt: periodEnd.toISOString(),
        range: {
          start: currentStart.toISOString(),
          end: periodEnd.toISOString(),
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
      })
    }

    if (decoded.role === "TEACHER") {
      if (!decoded.teacherId) {
        return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
      }

      const [currentBookings, previousBookings, currentSessions, previousSessions] = await Promise.all([
        db.booking.findMany({
          where: {
            studioId: studio.id,
            createdAt: { gte: currentStart, lt: periodEnd },
            classSession: { teacherId: decoded.teacherId },
          },
          select: {
            createdAt: true,
            status: true,
            clientId: true,
            paidAmount: true,
            classSession: { select: { classType: { select: { price: true } } } },
          },
        }),
        db.booking.findMany({
          where: {
            studioId: studio.id,
            createdAt: { gte: previousStart, lt: currentStart },
            classSession: { teacherId: decoded.teacherId },
          },
          select: {
            status: true,
            clientId: true,
            paidAmount: true,
            classSession: { select: { classType: { select: { price: true } } } },
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

      const currentNonCancelled = currentBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))
      const previousNonCancelled = previousBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status))

      const currentRevenue = roundCurrency(currentNonCancelled.reduce((sum, booking) => sum + bookingRevenue(booking), 0))
      const previousRevenue = roundCurrency(previousNonCancelled.reduce((sum, booking) => sum + bookingRevenue(booking), 0))

      const currentStudents = new Set(currentNonCancelled.map((booking) => booking.clientId)).size
      const previousStudents = new Set(previousNonCancelled.map((booking) => booking.clientId)).size

      const currentCompleted = currentNonCancelled.filter((booking) => booking.status === "COMPLETED").length
      const previousCompleted = previousNonCancelled.filter((booking) => booking.status === "COMPLETED").length

      const currentCapacity = currentSessions.reduce((sum, session) => sum + session.capacity, 0)
      const previousCapacity = previousSessions.reduce((sum, session) => sum + session.capacity, 0)
      const currentAttended = currentSessions.reduce(
        (sum, session) => sum + session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length,
        0
      )
      const previousAttended = previousSessions.reduce(
        (sum, session) => sum + session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length,
        0
      )

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
        const index = bucketIndexForDate(booking.createdAt, teacherBuckets)
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
        teacherAttendedByBucket[index] += session.bookings.filter((booking) => ATTENDED_STATUSES.has(booking.status)).length
      }

      teacherSeries.forEach((point, index) => {
        point.metrics.students = teacherStudentsByBucket[index].size
        point.metrics["fill-rate"] = ratioPercentage(teacherAttendedByBucket[index], teacherCapacityByBucket[index], 1)
        point.metrics["completion-rate"] = ratioPercentage(teacherCompletedByBucket[index], teacherNonCancelledByBucket[index], 1)
      })

      return NextResponse.json({
        role: "TEACHER",
        studio: studioSummary,
        periodDays,
        generatedAt: periodEnd.toISOString(),
        range: {
          start: currentStart.toISOString(),
          end: periodEnd.toISOString(),
        },
        metrics: [
          metric("revenue", "Revenue", "currency", currentRevenue, previousRevenue),
          metric("classes", "Classes", "number", currentSessions.length, previousSessions.length),
          metric("students", "Unique Students", "number", currentStudents, previousStudents),
          metric("fill-rate", "Fill Rate", "percent", ratioPercentage(currentAttended, currentCapacity, 1), ratioPercentage(previousAttended, previousCapacity, 1)),
          metric(
            "completion-rate",
            "Completion Rate",
            "percent",
            ratioPercentage(currentCompleted, currentNonCancelled.length, 1),
            ratioPercentage(previousCompleted, previousNonCancelled.length, 1)
          ),
        ],
        highlights: classTypeHighlights(currentSessions),
        series: teacherSeries,
      })
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

    return NextResponse.json({
      role: "CLIENT",
      studio: studioSummary,
      periodDays,
      generatedAt: periodEnd.toISOString(),
      range: {
        start: currentStart.toISOString(),
        end: periodEnd.toISOString(),
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
    })
  } catch (error) {
    console.error("Mobile reports error:", error)
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 })
  }
}

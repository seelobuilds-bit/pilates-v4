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
      const [currentBookings, previousBookings, currentSessions, previousSessions, currentNewClients, previousNewClients] = await Promise.all([
        db.booking.findMany({
          where: {
            studioId: studio.id,
            createdAt: { gte: currentStart, lt: periodEnd },
          },
          select: {
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
        db.client.count({
          where: {
            studioId: studio.id,
            createdAt: { gte: currentStart, lt: periodEnd },
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
    })
  } catch (error) {
    console.error("Mobile reports error:", error)
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 })
  }
}

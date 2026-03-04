import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveEntityReportDateRange } from "@/lib/reporting/date-range"
import {
  addCountToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBuckets,
} from "@/lib/reporting/monthly"
import { resolveBookingRevenue } from "@/lib/reporting/revenue"
import { calculateRepeatClientRetentionRate } from "@/lib/reporting/retention"

const DEFAULT_REPORT_PERIOD_DAYS = 30
const ALLOWED_DAY_PRESETS = new Set([7, 30, 90])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not found" }, { status: 404 })
    }

    const { teacherId } = await params
    const { startDate, endDate } = resolveEntityReportDateRange(request.nextUrl.searchParams, {
      defaultDays: DEFAULT_REPORT_PERIOD_DAYS,
      allowedDays: Array.from(ALLOWED_DAY_PRESETS),
    })

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, studioId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        classSessions: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: "asc" },
          take: 5,
          include: {
            classType: { select: { name: true } },
            location: { select: { name: true } },
            _count: { select: { bookings: true } }
          }
        },
        _count: { select: { classSessions: true } }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const allClassSessions = await db.classSession.findMany({
      where: { teacherId: teacher.id, studioId },
      include: {
        classType: { select: { name: true } },
        location: { select: { name: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "desc" }
    })

    const allBookings = await db.booking.findMany({
      where: {
        studioId,
        classSession: { teacherId: teacher.id }
      },
      include: {
        classSession: {
          include: {
            classType: { select: { name: true, price: true } },
            location: { select: { name: true } }
          }
        },
        client: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    const reportClassSessions = allClassSessions.filter((session) => {
      const classStart = new Date(session.startTime)
      return classStart >= startDate && classStart <= endDate
    })

    const reportBookings = allBookings.filter((booking) => {
      const classStart = new Date(booking.classSession.startTime)
      return classStart >= startDate && classStart <= endDate
    })

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const classesThisMonth = reportClassSessions.filter(
      (session) => new Date(session.startTime) >= thisMonthStart
    ).length

    const uniqueStudents = new Set(reportBookings.map((booking) => booking.clientId))
    const nonCancelledBookings = reportBookings.filter((booking) => booking.status !== "CANCELLED")
    const completedBookings = reportBookings.filter((booking) => booking.status === "COMPLETED").length

    const revenue = nonCancelledBookings.reduce((sum, booking) => {
      const amount = resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
      return sum + amount
    }, 0)

    const avgClassSize =
      reportClassSessions.length > 0
        ? Math.round((nonCancelledBookings.length / reportClassSessions.length) * 10) / 10
        : 0

    const completionRate =
      nonCancelledBookings.length > 0
        ? Math.round((completedBookings / nonCancelledBookings.length) * 100)
        : 0

    const clientBookingCounts = new Map<string, number>()
    for (const booking of nonCancelledBookings) {
      const name = `${booking.client.firstName} ${booking.client.lastName}`.trim()
      clientBookingCounts.set(name, (clientBookingCounts.get(name) || 0) + 1)
    }

    const retentionRate = calculateRepeatClientRetentionRate(clientBookingCounts, 0)

    const classCounts = new Map<string, number>()
    const locationCounts = new Map<string, number>()
    for (const session of reportClassSessions) {
      classCounts.set(session.classType.name, (classCounts.get(session.classType.name) || 0) + 1)
      locationCounts.set(session.location.name, (locationCounts.get(session.location.name) || 0) + 1)
    }

    const monthlyBuckets = buildMonthlyCountBuckets(endDate, 6)
    const monthLookup = buildMonthlyBucketLookup(monthlyBuckets)
    for (const session of reportClassSessions) {
      addCountToMonthlyBuckets(monthLookup, new Date(session.startTime))
    }

    const topClients = Array.from(clientBookingCounts.entries())
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    const extendedStats = {
      revenue: Math.round(revenue * 100) / 100,
      retentionRate,
      avgClassSize,
      completionRate,
      classBreakdown: Array.from(classCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      locationBreakdown: Array.from(locationCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      monthlyClasses: monthlyBuckets.map(({ month, count }) => ({ month, count })),
      ratingDataAvailable: false,
      recentReviews: [] as Array<{ clientName: string; rating: number; comment: string; date: string }>,
      topClients
    }

    return NextResponse.json({
      ...teacher,
      upcomingClasses: teacher.classSessions,
      stats: {
        totalClasses: reportClassSessions.length,
        totalStudents: uniqueStudents.size,
        averageRating: null,
        ratingDataAvailable: false,
        thisMonth: classesThisMonth
      },
      extendedStats
    })
  } catch (error) {
    console.error("Error fetching demo teacher:", error)
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 })
  }
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

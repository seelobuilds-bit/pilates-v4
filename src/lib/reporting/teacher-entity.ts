import {
  addCountToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBucketsByOffsets,
} from "./monthly"
import { resolveBookingRevenue } from "./revenue"
import { calculateRepeatClientRetentionRate } from "./retention"

export type TeacherEntitySessionLike = {
  startTime: Date
  classType: { name: string; price?: number }
  location: { name: string }
}

export type TeacherEntityBookingLike = {
  clientId: string
  status: string
  paidAmount: number | null
  classSession: {
    startTime: Date
    classType: { price: number }
  }
  client: {
    firstName: string
    lastName: string
  }
}

const DEFAULT_MONTH_OFFSETS = [-2, -1, 0, 1, 2, 3]

function roundTwo(value: number) {
  return Math.round(value * 100) / 100
}

export function buildTeacherEntityReportSummary(params: {
  reportClassSessions: TeacherEntitySessionLike[]
  reportBookings: TeacherEntityBookingLike[]
  allClassSessions: TeacherEntitySessionLike[]
  endDate: Date
  monthOffsets?: number[]
}) {
  const { reportClassSessions, reportBookings, allClassSessions, endDate } = params
  const monthOffsets = params.monthOffsets || DEFAULT_MONTH_OFFSETS

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
    reportClassSessions.length > 0 ? roundTwo(nonCancelledBookings.length / reportClassSessions.length) : 0

  const completionRate =
    nonCancelledBookings.length > 0 ? Math.round((completedBookings / nonCancelledBookings.length) * 100) : 0

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

  const monthlyBuckets = buildMonthlyCountBucketsByOffsets(endDate, monthOffsets)
  const monthLookup = buildMonthlyBucketLookup(monthlyBuckets)
  for (const session of allClassSessions) {
    addCountToMonthlyBuckets(monthLookup, new Date(session.startTime))
  }

  const topClients = Array.from(clientBookingCounts.entries())
    .map(([name, bookings]) => ({ name, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)

  return {
    stats: {
      totalClasses: reportClassSessions.length,
      totalStudents: uniqueStudents.size,
      averageRating: null,
      ratingDataAvailable: false,
      thisMonth: classesThisMonth,
    },
    extendedStats: {
      revenue: roundTwo(revenue),
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
      topClients,
    },
  }
}

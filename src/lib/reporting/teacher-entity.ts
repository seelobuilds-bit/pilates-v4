import {
  addCountToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBucketsByOffsets,
} from "./monthly"
import { roundTo } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { buildClientVisitCounts } from "./retention"
import { buildTeacherBookingSnapshot } from "./teacher-metrics"

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

  const { nonCancelledBookings, completedBookings, revenue, retentionRate } = buildTeacherBookingSnapshot({
    bookings: reportBookings,
    getStatus: (booking) => booking.status,
    getClientId: (booking) => booking.clientId,
    getRevenue: (booking) => resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price),
  })
  const uniqueStudents = new Set(reportBookings.map((booking) => booking.clientId))

  const avgClassSize =
    reportClassSessions.length > 0 ? roundTo(nonCancelledBookings.length / reportClassSessions.length, 2) : 0

  const completionRate =
    nonCancelledBookings.length > 0 ? Math.round((completedBookings / nonCancelledBookings.length) * 100) : 0

  const clientDisplayNameById = new Map<string, string>()
  for (const booking of nonCancelledBookings) {
    const name = `${booking.client.firstName} ${booking.client.lastName}`.trim()
    clientDisplayNameById.set(booking.clientId, name)
  }
  const clientBookingCounts = buildClientVisitCounts(nonCancelledBookings, (booking) => booking.clientId)

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
    .map(([clientId, bookings]) => ({
      name: clientDisplayNameById.get(clientId) || "Client",
      bookings,
    }))
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
      revenue: roundTo(revenue, 2),
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

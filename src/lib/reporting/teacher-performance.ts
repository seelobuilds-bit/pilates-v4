import {
  calculateAverageClassSize,
  calculateAverageFillRate,
  countAttendedBookings,
} from "./attendance"
import { ratioPercentage } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { buildTeacherBookingSnapshot } from "./teacher-metrics"

type TeacherBookingLike = {
  status: string
  clientId: string
  paidAmount: number | null
  classSession: {
    classType: {
      price: number
    }
  }
}

type TeacherSessionLike = {
  capacity: number
  classType?: {
    name: string
  } | null
  bookings: Array<{
    status: string
  }>
}

export function buildTeacherPerformanceSummary(
  sessions: TeacherSessionLike[],
  bookings: TeacherBookingLike[],
  decimals = 0
) {
  const { nonCancelledBookings, completedBookings, uniqueStudents, revenue, retentionRate } = buildTeacherBookingSnapshot({
    bookings,
    decimals,
    getStatus: (booking) => booking.status,
    getClientId: (booking) => booking.clientId,
    getRevenue: (booking) => resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price),
  })

  const totalAttendance = sessions.reduce((sum, session) => sum + countAttendedBookings(session.bookings), 0)
  const avgClassSize = calculateAverageClassSize(totalAttendance, sessions.length)
  const avgFillRate = calculateAverageFillRate(sessions, decimals)
  const completionRate = ratioPercentage(completedBookings, nonCancelledBookings.length, decimals)

  const classCounts = new Map<string, number>()
  for (const session of sessions) {
    const className = session.classType?.name
    if (!className) continue
    classCounts.set(className, (classCounts.get(className) || 0) + 1)
  }

  const topClasses = Array.from(classCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalClasses: sessions.length,
    totalStudents: uniqueStudents.size,
    revenue,
    avgClassSize,
    avgFillRate,
    completionRate,
    retentionRate,
    totalAttendance,
    topClasses,
    nonCancelledBookings,
    completedBookings,
  }
}

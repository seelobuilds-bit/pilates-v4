import {
  calculateAverageClassSize,
  calculateAverageFillRate,
  countAttendedBookings,
} from "./attendance"
import { ratioPercentage, roundCurrency } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { calculateRepeatClientRetentionRate } from "./retention"

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
  const nonCancelledBookings = bookings.filter((booking) => booking.status !== "CANCELLED")
  const uniqueStudents = new Set(nonCancelledBookings.map((booking) => booking.clientId))
  const completedBookings = nonCancelledBookings.filter((booking) => booking.status === "COMPLETED").length

  const revenue = roundCurrency(
    nonCancelledBookings.reduce((sum, booking) => {
      return sum + resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    }, 0)
  )

  const totalAttendance = sessions.reduce((sum, session) => sum + countAttendedBookings(session.bookings), 0)
  const avgClassSize = calculateAverageClassSize(totalAttendance, sessions.length)
  const avgFillRate = calculateAverageFillRate(sessions, decimals)
  const completionRate = ratioPercentage(completedBookings, nonCancelledBookings.length, decimals)

  const clientBookingCounts = new Map<string, number>()
  for (const booking of nonCancelledBookings) {
    clientBookingCounts.set(booking.clientId, (clientBookingCounts.get(booking.clientId) || 0) + 1)
  }
  const retentionRate = calculateRepeatClientRetentionRate(clientBookingCounts, decimals)

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

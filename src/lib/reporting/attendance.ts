import { ratioPercentage, roundTo } from "./metrics"

export const ATTENDED_BOOKING_STATUSES = new Set(["CONFIRMED", "COMPLETED", "NO_SHOW"])

export function isAttendedBookingStatus(status: string) {
  return ATTENDED_BOOKING_STATUSES.has(status)
}

export function countAttendedBookings(bookings: Array<{ status: string }>) {
  return bookings.filter((booking) => isAttendedBookingStatus(booking.status)).length
}

export function calculateAverageClassSize(totalAttended: number, totalSessions: number) {
  return totalSessions > 0 ? roundTo(totalAttended / totalSessions, 1) : 0
}

export function calculateAverageFillRate(
  sessions: Array<{ capacity: number; bookings: Array<{ status: string }> }>,
  decimals = 0
) {
  if (sessions.length === 0) return 0

  const sum = sessions.reduce((total, session) => {
    return total + ratioPercentage(countAttendedBookings(session.bookings), session.capacity, 4)
  }, 0)

  return roundTo(sum / sessions.length, decimals)
}

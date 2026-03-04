import { roundCurrency } from "./metrics"
import { buildClientVisitCounts, calculateRepeatClientRetentionRate } from "./retention"

export function buildRepeatClientRetentionFromValues(clientIds: Iterable<string>, decimals: number) {
  const clientVisitCounts = buildClientVisitCounts(Array.from(clientIds), (clientId) => clientId)
  return calculateRepeatClientRetentionRate(clientVisitCounts, decimals)
}

export function buildTeacherBookingSnapshot<T>(args: {
  bookings: T[]
  decimals?: number
  getStatus: (booking: T) => string
  getClientId: (booking: T) => string
  getRevenue: (booking: T) => number
}) {
  const { bookings, getStatus, getClientId, getRevenue } = args
  const decimals = args.decimals ?? 0

  const nonCancelledBookings = bookings.filter((booking) => getStatus(booking) !== "CANCELLED")
  const completedBookings = nonCancelledBookings.filter((booking) => getStatus(booking) === "COMPLETED").length
  const uniqueStudents = new Set(nonCancelledBookings.map((booking) => getClientId(booking)))
  const revenue = roundCurrency(nonCancelledBookings.reduce((sum, booking) => sum + getRevenue(booking), 0))
  const retentionRate = buildRepeatClientRetentionFromValues(
    nonCancelledBookings.map((booking) => getClientId(booking)),
    decimals
  )

  return {
    nonCancelledBookings,
    completedBookings,
    uniqueStudents,
    revenue,
    retentionRate,
  }
}

export function buildNonCancelledBookingAggregate<T>(args: {
  bookings: T[]
  getStatus: (booking: T) => string
  getRevenue: (booking: T) => number
}) {
  const { bookings, getStatus, getRevenue } = args

  const nonCancelledBookings = bookings.filter((booking) => getStatus(booking) !== "CANCELLED")
  const totalRevenue = nonCancelledBookings.reduce((sum, booking) => sum + getRevenue(booking), 0)

  return {
    nonCancelledBookings,
    totalRevenue,
  }
}

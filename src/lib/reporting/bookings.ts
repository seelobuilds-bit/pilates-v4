import { roundTo } from "./metrics"

type BookingLike = {
  status: string
  clientId: string
}

type BookingSummary = {
  total: number
  uniqueClients: number
  newClientBookings: number
  averageBookingsPerClient: number
  byStatus: Array<{ status: string; count: number }>
}

export function buildBookingSummary({
  bookings,
  clientCreatedAtById,
  startDate,
  reportEndDate,
}: {
  bookings: BookingLike[]
  clientCreatedAtById: Map<string, Date>
  startDate: Date
  reportEndDate: Date
}): BookingSummary {
  const statusCounts: Record<string, number> = {}
  for (const booking of bookings) {
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
  }

  const validBookings = bookings.filter((booking) => booking.status !== "CANCELLED")
  const uniqueBookedClients = new Set(validBookings.map((booking) => booking.clientId))
  const newClientBookings = validBookings.filter((booking) => {
    const createdAt = clientCreatedAtById.get(booking.clientId)
    return createdAt ? createdAt >= startDate && createdAt < reportEndDate : false
  }).length

  return {
    total: validBookings.length,
    uniqueClients: uniqueBookedClients.size,
    newClientBookings,
    averageBookingsPerClient: roundTo(
      uniqueBookedClients.size > 0 ? validBookings.length / uniqueBookedClients.size : 0,
      2
    ),
    byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
  }
}

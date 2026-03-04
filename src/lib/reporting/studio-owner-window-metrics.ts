import { BookingStatus } from "@prisma/client"
import { countAttendedBookings } from "./attendance"
import { ratioPercentage, roundCurrency } from "./metrics"
import { buildRevenueSummary } from "./revenue-summary"

const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type BookingLike = {
  status: BookingStatus
  paidAmount: number | null
  classSession: {
    classType: {
      price: number
    }
  }
}

type SessionLike = {
  capacity: number
  bookings: Array<{
    status: BookingStatus
  }>
}

export function buildStudioOwnerWindowMetrics(args: {
  currentBookings: BookingLike[]
  previousBookings: BookingLike[]
  currentSessions: SessionLike[]
  previousSessions: SessionLike[]
  currentNewClients: number
  previousNewClients: number
  periodEnd: Date
}) {
  const {
    currentBookings,
    previousBookings,
    currentSessions,
    previousSessions,
    currentNewClients,
    previousNewClients,
    periodEnd,
  } = args

  const revenueSummary = buildRevenueSummary({
    bookings: currentBookings,
    previousBookings,
    monthlyBookings: [],
    referenceDate: periodEnd,
  })

  const currentBooked = currentBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length
  const previousBooked = previousBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length

  const currentCapacity = currentSessions.reduce((sum, session) => sum + session.capacity, 0)
  const previousCapacity = previousSessions.reduce((sum, session) => sum + session.capacity, 0)
  const currentAttended = currentSessions.reduce(
    (sum, session) => sum + countAttendedBookings(session.bookings),
    0
  )
  const previousAttended = previousSessions.reduce(
    (sum, session) => sum + countAttendedBookings(session.bookings),
    0
  )

  return {
    currentRevenue: roundCurrency(revenueSummary.total),
    previousRevenue: roundCurrency(revenueSummary.previousTotal),
    currentBooked,
    previousBooked,
    currentClasses: currentSessions.length,
    previousClasses: previousSessions.length,
    currentFillRate: ratioPercentage(currentAttended, currentCapacity, 1),
    previousFillRate: ratioPercentage(previousAttended, previousCapacity, 1),
    currentNewClients,
    previousNewClients,
  }
}

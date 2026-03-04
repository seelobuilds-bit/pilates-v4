import { BookingStatus } from "@prisma/client"
import { ratioPercentage } from "./metrics"

const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type ClientBooking = {
  status: BookingStatus
}

export function buildMobileClientWindowMetrics(args: {
  currentBookings: ClientBooking[]
  previousBookings: ClientBooking[]
}) {
  const { currentBookings, previousBookings } = args
  const currentBooked = currentBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length
  const previousBooked = previousBookings.filter((booking) => NON_CANCELLED_STATUSES.has(booking.status)).length

  const currentCompleted = currentBookings.filter((booking) => booking.status === "COMPLETED").length
  const previousCompleted = previousBookings.filter((booking) => booking.status === "COMPLETED").length
  const currentCancelled = currentBookings.filter((booking) => booking.status === "CANCELLED").length
  const previousCancelled = previousBookings.filter((booking) => booking.status === "CANCELLED").length

  return {
    currentBooked,
    previousBooked,
    currentCompleted,
    previousCompleted,
    currentCancelled,
    previousCancelled,
    currentCompletionRate: ratioPercentage(currentCompleted, currentBooked, 1),
    previousCompletionRate: ratioPercentage(previousCompleted, previousBooked, 1),
  }
}

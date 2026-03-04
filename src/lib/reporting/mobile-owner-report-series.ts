import { BookingStatus } from "@prisma/client"
import { countAttendedBookings } from "./attendance"
import { ratioPercentage, roundCurrency } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { bucketIndexForDate, buildTrendBuckets } from "./trend-series"

const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type OwnerBooking = {
  status: BookingStatus
  paidAmount: number | null
  classSession: {
    startTime: Date
    classType: {
      price: number
    }
  }
}

type OwnerSession = {
  startTime: Date
  capacity: number
  bookings: Array<{ status: BookingStatus }>
}

type OwnerClient = {
  createdAt: Date
}

export function buildMobileOwnerSeries(args: {
  startDate: Date
  endDate: Date
  bookings: OwnerBooking[]
  sessions: OwnerSession[]
  newClients: OwnerClient[]
}) {
  const { startDate, endDate, bookings, sessions, newClients } = args
  const buckets = buildTrendBuckets(startDate, endDate)
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    start: bucket.start.toISOString(),
    end: bucket.end.toISOString(),
    metrics: {
      revenue: 0,
      bookings: 0,
      classes: 0,
      "fill-rate": 0,
      "new-clients": 0,
    },
  }))
  const capacityByBucket = buckets.map(() => 0)
  const attendedByBucket = buckets.map(() => 0)

  for (const booking of bookings) {
    if (!NON_CANCELLED_STATUSES.has(booking.status)) continue
    const index = bucketIndexForDate(booking.classSession.startTime, buckets)
    if (index < 0) continue
    series[index].metrics.bookings += 1
    series[index].metrics.revenue = roundCurrency(
      series[index].metrics.revenue + resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    )
  }

  for (const session of sessions) {
    const index = bucketIndexForDate(session.startTime, buckets)
    if (index < 0) continue
    series[index].metrics.classes += 1
    capacityByBucket[index] += session.capacity
    attendedByBucket[index] += countAttendedBookings(session.bookings)
  }

  for (const client of newClients) {
    const index = bucketIndexForDate(client.createdAt, buckets)
    if (index < 0) continue
    series[index].metrics["new-clients"] += 1
  }

  series.forEach((point, index) => {
    point.metrics["fill-rate"] = ratioPercentage(attendedByBucket[index], capacityByBucket[index], 1)
  })

  return series
}

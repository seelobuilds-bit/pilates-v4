import { BookingStatus } from "@prisma/client"
import { ratioPercentage } from "./metrics"
import { bucketIndexForDate, buildTrendBuckets } from "./trend-series"

const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type ClientBooking = {
  status: BookingStatus
  classSession: {
    startTime: Date
  }
}

export function buildMobileClientSeries(args: {
  startDate: Date
  endDate: Date
  bookings: ClientBooking[]
}) {
  const { startDate, endDate, bookings } = args
  const buckets = buildTrendBuckets(startDate, endDate)
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    start: bucket.start.toISOString(),
    end: bucket.end.toISOString(),
    metrics: {
      booked: 0,
      completed: 0,
      cancelled: 0,
      "completion-rate": 0,
    },
  }))
  const completedByBucket = buckets.map(() => 0)
  const bookedByBucket = buckets.map(() => 0)

  for (const booking of bookings) {
    const index = bucketIndexForDate(booking.classSession.startTime, buckets)
    if (index < 0) continue

    if (NON_CANCELLED_STATUSES.has(booking.status)) {
      bookedByBucket[index] += 1
      series[index].metrics.booked += 1
    }

    if (booking.status === "COMPLETED") {
      completedByBucket[index] += 1
      series[index].metrics.completed += 1
    }

    if (booking.status === "CANCELLED") {
      series[index].metrics.cancelled += 1
    }
  }

  series.forEach((point, index) => {
    point.metrics["completion-rate"] = ratioPercentage(completedByBucket[index], bookedByBucket[index], 1)
  })

  return series
}

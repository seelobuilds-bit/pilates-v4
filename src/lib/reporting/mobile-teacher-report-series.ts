import { BookingStatus } from "@prisma/client"
import { countAttendedBookings } from "./attendance"
import { ratioPercentage, roundCurrency } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { bucketIndexForDate, buildTrendBuckets } from "./trend-series"

const NON_CANCELLED_STATUSES = new Set<BookingStatus>(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"])

type TeacherBooking = {
  status: BookingStatus
  clientId: string
  paidAmount: number | null
  classSession: {
    startTime: Date
    classType: {
      price: number
    }
  }
}

type TeacherSession = {
  startTime: Date
  capacity: number
  bookings: Array<{ status: BookingStatus }>
}

export function buildMobileTeacherSeries(args: {
  startDate: Date
  endDate: Date
  bookings: TeacherBooking[]
  sessions: TeacherSession[]
}) {
  const { startDate, endDate, bookings, sessions } = args
  const buckets = buildTrendBuckets(startDate, endDate)
  const series = buckets.map((bucket) => ({
    label: bucket.label,
    start: bucket.start.toISOString(),
    end: bucket.end.toISOString(),
    metrics: {
      revenue: 0,
      classes: 0,
      students: 0,
      "fill-rate": 0,
      "completion-rate": 0,
    },
  }))
  const capacityByBucket = buckets.map(() => 0)
  const attendedByBucket = buckets.map(() => 0)
  const completedByBucket = buckets.map(() => 0)
  const nonCancelledByBucket = buckets.map(() => 0)
  const studentsByBucket = buckets.map(() => new Set<string>())

  for (const booking of bookings) {
    if (!NON_CANCELLED_STATUSES.has(booking.status)) continue
    const index = bucketIndexForDate(booking.classSession.startTime, buckets)
    if (index < 0) continue
    nonCancelledByBucket[index] += 1
    series[index].metrics.revenue = roundCurrency(
      series[index].metrics.revenue + resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    )
    studentsByBucket[index].add(booking.clientId)
    if (booking.status === "COMPLETED") {
      completedByBucket[index] += 1
    }
  }

  for (const session of sessions) {
    const index = bucketIndexForDate(session.startTime, buckets)
    if (index < 0) continue
    series[index].metrics.classes += 1
    capacityByBucket[index] += session.capacity
    attendedByBucket[index] += countAttendedBookings(session.bookings)
  }

  series.forEach((point, index) => {
    point.metrics.students = studentsByBucket[index].size
    point.metrics["fill-rate"] = ratioPercentage(attendedByBucket[index], capacityByBucket[index], 1)
    point.metrics["completion-rate"] = ratioPercentage(completedByBucket[index], nonCancelledByBucket[index], 1)
  })

  return series
}

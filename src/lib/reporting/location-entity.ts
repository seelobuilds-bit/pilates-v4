import {
  addRevenueToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyRevenueBuckets,
} from "./monthly"
import { roundTo } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { buildNonCancelledBookingAggregate } from "./booking-aggregates"

export type LocationEntitySessionLike = {
  startTime: Date
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
}

export type LocationEntityBookingLike = {
  clientId: string
  status: string
  paidAmount: number | null
  createdAt: Date
  client: {
    firstName: string
    lastName: string
    isActive: boolean
  }
  classSession: {
    startTime: Date
    classType: {
      name: string
      price: number
    }
  }
}

export function buildLocationEntityStats(params: {
  classSessions: LocationEntitySessionLike[]
  bookings: LocationEntityBookingLike[]
  endDate: Date
}) {
  const { classSessions, bookings, endDate } = params
  const { nonCancelledBookings, totalRevenue } = buildNonCancelledBookingAggregate({
    bookings,
    getStatus: (booking) => booking.status,
    getRevenue: (booking) => resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price),
  })

  const activeClientIds = new Set(
    nonCancelledBookings.filter((booking) => booking.client.isActive).map((booking) => booking.clientId)
  )

  const classCounts = new Map<string, number>()
  const teacherCounts = new Map<string, number>()
  const bookingsByDayMap = new Map<string, number>([
    ["Sun", 0],
    ["Mon", 0],
    ["Tue", 0],
    ["Wed", 0],
    ["Thu", 0],
    ["Fri", 0],
    ["Sat", 0],
  ])

  for (const booking of nonCancelledBookings) {
    const className = booking.classSession.classType.name
    classCounts.set(className, (classCounts.get(className) || 0) + 1)

    const dayKey = new Date(booking.classSession.startTime).toLocaleDateString("en-US", { weekday: "short" })
    bookingsByDayMap.set(dayKey, (bookingsByDayMap.get(dayKey) || 0) + 1)
  }

  for (const session of classSessions) {
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`.trim()
    teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1)
  }

  const monthlyBuckets = buildMonthlyRevenueBuckets(endDate, 6)
  const monthlyLookup = buildMonthlyBucketLookup(monthlyBuckets)
  for (const booking of nonCancelledBookings) {
    const date = new Date(booking.classSession.startTime)
    const amount = resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    addRevenueToMonthlyBuckets(monthlyLookup, date, amount)
  }

  return {
    totalBookings: nonCancelledBookings.length,
    totalRevenue: roundTo(totalRevenue, 2),
    activeClients: activeClientIds.size,
    avgClassSize: classSessions.length > 0 ? roundTo(nonCancelledBookings.length / classSessions.length, 2) : 0,
    topClasses: Array.from(classCounts.entries())
      .map(([name, bookingsCount]) => ({ name, bookings: bookingsCount }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5),
    topTeachers: Array.from(teacherCounts.entries())
      .map(([name, classes]) => ({ name, classes, rating: null }))
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 5),
    ratingDataAvailable: false,
    recentBookings: nonCancelledBookings.slice(0, 10).map((booking) => ({
      clientName: `${booking.client.firstName} ${booking.client.lastName}`.trim(),
      className: booking.classSession.classType.name,
      date: new Date(booking.createdAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    })),
    bookingsByDay: Array.from(bookingsByDayMap.entries()).map(([day, count]) => ({ day, count })),
    monthlyRevenue: monthlyBuckets.map(({ month, revenue }) => ({
      month,
      revenue: roundTo(revenue, 2),
    })),
  }
}

import {
  addCountToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBuckets,
} from "./monthly"
import { resolveBookingRevenue } from "./revenue"

export type ClassTypeEntitySessionLike = {
  startTime: Date
  capacity: number
  locationId: string
  teacherId: string
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
  location: {
    name: string
  }
  _count: {
    bookings: number
  }
}

export type ClassTypeEntityBookingLike = {
  status: string
  paidAmount: number | null
  classSession: {
    startTime: Date
    location: {
      name: string
    }
  }
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100
}

export function buildClassTypeEntityStats(params: {
  classSessions: ClassTypeEntitySessionLike[]
  bookings: ClassTypeEntityBookingLike[]
  classPrice: number
  endDate: Date
}) {
  const { classSessions, bookings, classPrice, endDate } = params
  const nonCancelledBookings = bookings.filter((booking) => booking.status !== "CANCELLED")
  const totalRevenue = nonCancelledBookings.reduce((sum, booking) => {
    const amount = resolveBookingRevenue(booking.paidAmount, classPrice)
    return sum + amount
  }, 0)

  const teacherCounts = new Map<string, number>()
  const locationBookingCounts = new Map<string, number>()
  const timeSlotCounts = new Map<string, number>()

  for (const session of classSessions) {
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`.trim()
    teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1)

    const slot = new Date(session.startTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
    timeSlotCounts.set(slot, (timeSlotCounts.get(slot) || 0) + 1)
  }

  for (const booking of nonCancelledBookings) {
    const locationName = booking.classSession.location.name
    locationBookingCounts.set(locationName, (locationBookingCounts.get(locationName) || 0) + 1)
  }

  const monthlyBuckets = buildMonthlyCountBuckets(endDate, 6)
  const monthlyLookup = buildMonthlyBucketLookup(monthlyBuckets)
  for (const booking of nonCancelledBookings) {
    addCountToMonthlyBuckets(monthlyLookup, new Date(booking.classSession.startTime))
  }

  const recentClasses = classSessions.slice(0, 10).map((session) => ({
    date: new Date(session.startTime).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    teacher: `${session.teacher.user.firstName} ${session.teacher.user.lastName}`.trim(),
    location: session.location.name,
    attendance: session._count.bookings,
    capacity: session.capacity,
  }))

  return {
    totalBookings: bookings.length,
    totalRevenue: roundTwo(totalRevenue),
    avgAttendance: classSessions.length > 0 ? roundTwo(nonCancelledBookings.length / classSessions.length) : 0,
    avgRating: null,
    ratingDataAvailable: false,
    topTeachers: Array.from(teacherCounts.entries())
      .map(([name, classes]) => ({ name, classes, rating: null }))
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 5),
    topLocations: Array.from(locationBookingCounts.entries())
      .map(([name, bookingsCount]) => ({ name, bookings: bookingsCount }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5),
    monthlyBookings: monthlyBuckets.map(({ month, count }) => ({ month, count })),
    popularTimes: Array.from(timeSlotCounts.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    recentClasses,
  }
}


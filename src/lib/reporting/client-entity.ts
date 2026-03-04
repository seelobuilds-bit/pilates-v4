import {
  addCountToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBuckets,
} from "./monthly"
import { resolveBookingRevenue } from "./revenue"
import { buildNonCancelledBookingAggregate } from "./booking-aggregates"

export type ClientEntityBookingLike = {
  status: string
  paidAmount: number | null
  createdAt: Date
  classSession: {
    startTime: Date
    classType: {
      name: string
      price: number
    }
    teacher: {
      user: {
        firstName: string
        lastName: string
      }
    }
    location: {
      name: string
    }
  }
}

export type ClientEntityMessageLike = {
  id: string
  channel: "CHAT" | "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  subject: string | null
  body: string
  createdAt: Date
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function resolveActivityAction(status: string) {
  if (status === "CONFIRMED") return "Booked"
  if (status === "COMPLETED") return "Completed"
  if (status === "CANCELLED") return "Cancelled"
  if (status === "NO_SHOW") return "No Show"
  if (status === "PENDING") return "Pending"
  return "Updated"
}

export function buildClientEntityStats(params: {
  reportBookings: ClientEntityBookingLike[]
  endDate: Date
  credits: number
}) {
  const { reportBookings, endDate, credits } = params
  const { nonCancelledBookings, totalRevenue: rawTotalSpent } = buildNonCancelledBookingAggregate({
    bookings: reportBookings,
    getStatus: (booking) => booking.status,
    getRevenue: (booking) => resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price),
  })
  const completedClasses = reportBookings.filter((booking) => booking.status === "COMPLETED").length
  const cancelledClasses = reportBookings.filter((booking) => booking.status === "CANCELLED").length

  const totalSpent = rawTotalSpent

  const totalBookings = nonCancelledBookings.length
  const totalBookingAttempts = reportBookings.length
  const cancelRate = totalBookingAttempts > 0 ? roundOne((cancelledClasses / totalBookingAttempts) * 100) : 0

  const classCounts = new Map<string, number>()
  const teacherCounts = new Map<string, number>()
  const locationCounts = new Map<string, number>()

  for (const booking of nonCancelledBookings) {
    const className = booking.classSession.classType.name
    classCounts.set(className, (classCounts.get(className) || 0) + 1)

    const teacherName = `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`.trim()
    teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1)

    const locationName = booking.classSession.location.name
    locationCounts.set(locationName, (locationCounts.get(locationName) || 0) + 1)
  }

  const classBreakdown = Array.from(classCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const teacherBreakdown = Array.from(teacherCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const locationBreakdown = Array.from(locationCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const oldestBookingDate = nonCancelledBookings.reduce<Date | null>((oldest, booking) => {
    const classStart = booking.classSession.startTime
    if (!oldest || classStart < oldest) return classStart
    return oldest
  }, null)
  let avgBookingsPerMonth = 0
  if (oldestBookingDate && totalBookings > 0) {
    const monthDiff =
      (endDate.getFullYear() - oldestBookingDate.getFullYear()) * 12 +
      (endDate.getMonth() - oldestBookingDate.getMonth()) +
      1
    const activeMonths = Math.max(1, monthDiff)
    avgBookingsPerMonth = roundOne(totalBookings / activeMonths)
  }

  const monthlyBuckets = buildMonthlyCountBuckets(endDate, 6)
  const bucketLookup = buildMonthlyBucketLookup(monthlyBuckets)
  for (const booking of nonCancelledBookings) {
    addCountToMonthlyBuckets(bucketLookup, new Date(booking.classSession.startTime))
  }

  const activityTimeline = reportBookings.slice(0, 10).map((booking) => {
    const classDate = new Date(booking.classSession.startTime)
    return {
      date: new Date(booking.createdAt).toLocaleDateString(),
      action: resolveActivityAction(booking.status),
      details: `${booking.classSession.classType.name} - ${classDate.toLocaleDateString()} ${classDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    }
  })

  return {
    totalSpent: roundTwo(totalSpent),
    totalBookings,
    completedClasses,
    cancelRate,
    avgBookingsPerMonth,
    membershipType: credits > 0 ? `${credits} credit${credits === 1 ? "" : "s"} available` : "No active package",
    favoriteClass: classBreakdown[0]?.name || "No data yet",
    favoriteTeacher: teacherBreakdown[0]?.name || "No data yet",
    favoriteLocation: locationBreakdown[0]?.name || "No data yet",
    classBreakdown,
    teacherBreakdown,
    locationBreakdown,
    monthlyBookings: monthlyBuckets.map(({ month, count }) => ({ month, count })),
    activityTimeline,
  }
}

export function mapClientCommunications(messages: ClientEntityMessageLike[]) {
  return messages.map((message) => ({
    id: message.id,
    type: message.channel === "CHAT" ? "chat" : message.channel === "SMS" ? "sms" : "email",
    direction: message.direction === "INBOUND" ? "inbound" : "outbound",
    subject: message.subject || undefined,
    content: message.body,
    timestamp: message.createdAt.toISOString(),
  }))
}

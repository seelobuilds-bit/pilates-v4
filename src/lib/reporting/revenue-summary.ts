import {
  addRevenueToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyRevenueBuckets,
} from "./monthly"
import { resolveBookingRevenue } from "./revenue"

type RevenueBookingLike = {
  status: string
  paidAmount: number | null
  classSession: {
    startTime?: Date
    classType: {
      name?: string
      price: number | null
    }
    location?: {
      name: string
    }
  }
}

type RevenueSummary = {
  total: number
  previousTotal: number
  byLocation: Array<{ name: string; amount: number }>
  byClassType: Array<{ name: string; amount: number }>
  monthly: Array<{ month: string; amount: number; target: number }>
}

export function buildRevenueSummary({
  bookings,
  previousBookings,
  monthlyBookings,
  referenceDate = new Date(),
}: {
  bookings: RevenueBookingLike[]
  previousBookings: RevenueBookingLike[]
  monthlyBookings: RevenueBookingLike[]
  referenceDate?: Date
}): RevenueSummary {
  const revenueByLocation: Record<string, number> = {}
  const revenueByClassType: Record<string, number> = {}
  let totalRevenue = 0

  for (const booking of bookings) {
    if (booking.status === "CANCELLED") continue
    const amount = resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    totalRevenue += amount

    const locationName = booking.classSession.location?.name
    if (locationName) {
      revenueByLocation[locationName] = (revenueByLocation[locationName] || 0) + amount
    }

    const className = booking.classSession.classType.name
    if (className) {
      revenueByClassType[className] = (revenueByClassType[className] || 0) + amount
    }
  }

  const previousTotalRevenue = previousBookings.reduce((sum, booking) => {
    if (booking.status === "CANCELLED") return sum
    const amount = resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    return sum + amount
  }, 0)

  const monthlyRevenueBuckets = buildMonthlyRevenueBuckets(referenceDate, 6)
  const monthlyRevenueLookup = buildMonthlyBucketLookup(monthlyRevenueBuckets)

  for (const booking of monthlyBookings) {
    if (booking.status === "CANCELLED") continue
    if (!booking.classSession.startTime) continue
    const amount = resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    addRevenueToMonthlyBuckets(monthlyRevenueLookup, new Date(booking.classSession.startTime), amount)
  }

  return {
    total: totalRevenue,
    previousTotal: previousTotalRevenue,
    byLocation: Object.entries(revenueByLocation).map(([name, amount]) => ({ name, amount })),
    byClassType: Object.entries(revenueByClassType).map(([name, amount]) => ({ name, amount })),
    monthly: monthlyRevenueBuckets.map((bucket) => ({
      month: bucket.month,
      amount: bucket.revenue,
      target: bucket.revenue,
    })),
  }
}

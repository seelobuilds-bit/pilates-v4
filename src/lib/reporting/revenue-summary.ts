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

  const monthlyRevenueMap = new Map<string, { month: string; amount: number; target: number }>()
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(referenceDate)
    date.setMonth(date.getMonth() - i)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthlyRevenueMap.set(key, {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      amount: 0,
      target: 0,
    })
  }

  for (const booking of monthlyBookings) {
    if (booking.status === "CANCELLED") continue
    if (!booking.classSession.startTime) continue
    const date = new Date(booking.classSession.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthlyRevenueMap.get(key)
    if (!bucket) continue
    const amount = resolveBookingRevenue(booking.paidAmount, booking.classSession.classType.price)
    bucket.amount += amount
  }

  for (const bucket of monthlyRevenueMap.values()) {
    bucket.target = bucket.amount
  }

  return {
    total: totalRevenue,
    previousTotal: previousTotalRevenue,
    byLocation: Object.entries(revenueByLocation).map(([name, amount]) => ({ name, amount })),
    byClassType: Object.entries(revenueByClassType).map(([name, amount]) => ({ name, amount })),
    monthly: Array.from(monthlyRevenueMap.values()),
  }
}

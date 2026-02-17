import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const ATTENDED_BOOKING_STATUSES = new Set(["CONFIRMED", "COMPLETED", "NO_SHOW"])

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studioId = session.user.studioId
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get("days") || "30")
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const previousStartDate = new Date(startDate)
  previousStartDate.setDate(previousStartDate.getDate() - days)

  const monthWindowStart = new Date()
  monthWindowStart.setMonth(monthWindowStart.getMonth() - 5)
  monthWindowStart.setDate(1)
  monthWindowStart.setHours(0, 0, 0, 0)

  const bookings = await db.booking.findMany({
    where: {
      studioId,
      classSession: {
        startTime: { gte: startDate }
      }
    },
    include: {
      classSession: {
        include: {
          classType: true,
          location: true
        }
      }
    }
  })

  const previousBookings = await db.booking.findMany({
    where: {
      studioId,
      classSession: {
        startTime: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    },
    include: {
      classSession: {
        include: {
          classType: true
        }
      }
    }
  })

  const monthlyBookings = await db.booking.findMany({
    where: {
      studioId,
      classSession: {
        startTime: { gte: monthWindowStart }
      }
    },
    include: {
      classSession: {
        include: {
          classType: true
        }
      }
    }
  })

  const revenueByLocation: Record<string, number> = {}
  const revenueByClassType: Record<string, number> = {}
  let totalRevenue = 0

  for (const booking of bookings) {
    if (booking.status === "CANCELLED") continue
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    totalRevenue += amount

    const locationName = booking.classSession.location.name
    revenueByLocation[locationName] = (revenueByLocation[locationName] || 0) + amount

    const className = booking.classSession.classType.name
    revenueByClassType[className] = (revenueByClassType[className] || 0) + amount
  }

  const previousTotalRevenue = previousBookings.reduce((sum, booking) => {
    if (booking.status === "CANCELLED") return sum
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    return sum + amount
  }, 0)

  const monthlyRevenueMap = new Map<string, { month: string; amount: number; target: number }>()
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthlyRevenueMap.set(key, {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      amount: 0,
      target: 0
    })
  }
  for (const booking of monthlyBookings) {
    if (booking.status === "CANCELLED") continue
    const date = new Date(booking.classSession.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthlyRevenueMap.get(key)
    if (!bucket) continue
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    bucket.amount += amount
  }
  for (const bucket of monthlyRevenueMap.values()) {
    bucket.target = bucket.amount
  }

  const totalClients = await db.client.count({ where: { studioId } })
  const newClients = await db.client.count({
    where: {
      studioId,
      createdAt: { gte: startDate }
    }
  })
  const activeClients = await db.client.count({
    where: {
      studioId,
      isActive: true
    }
  })
  const churnedClients = await db.client.count({
    where: {
      studioId,
      isActive: false
    }
  })

  const classSessions = await db.classSession.findMany({
    where: {
      studioId,
      startTime: { gte: startDate }
    },
    include: {
      classType: true,
      location: true,
      teacher: { include: { user: true } },
      bookings: {
        select: { status: true }
      },
      _count: {
        select: { waitlists: true }
      }
    }
  })

  const classesByLocation: Record<string, number> = {}
  const classesByTeacher: Record<string, number> = {}
  const byTimeSlotMap = new Map<string, { time: string; fillTotal: number; classes: number }>()
  const byDayMap = new Map<string, { day: string; fillTotal: number; classes: number }>()
  const byClassTypeMap = new Map<
    string,
    {
      id: string
      name: string
      fillTotal: number
      classes: number
      waitlist: number
    }
  >()

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  for (const day of dayOrder) {
    byDayMap.set(day, { day, fillTotal: 0, classes: 0 })
  }

  for (const session of classSessions) {
    classesByLocation[session.location.name] = (classesByLocation[session.location.name] || 0) + 1
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`
    classesByTeacher[teacherName] = (classesByTeacher[teacherName] || 0) + 1

    const attendedCount = session.bookings.filter((booking) => ATTENDED_BOOKING_STATUSES.has(booking.status)).length
    const fill = session.capacity > 0 ? Math.round((attendedCount / session.capacity) * 100) : 0

    const slotLabel = new Date(session.startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    })
    const slotEntry = byTimeSlotMap.get(slotLabel) || { time: slotLabel, fillTotal: 0, classes: 0 }
    slotEntry.fillTotal += fill
    slotEntry.classes += 1
    byTimeSlotMap.set(slotLabel, slotEntry)

    const dayLabel = new Date(session.startTime).toLocaleDateString("en-US", { weekday: "short" })
    const dayEntry = byDayMap.get(dayLabel) || { day: dayLabel, fillTotal: 0, classes: 0 }
    dayEntry.fillTotal += fill
    dayEntry.classes += 1
    byDayMap.set(dayLabel, dayEntry)

    const classEntry = byClassTypeMap.get(session.classTypeId) || {
      id: session.classTypeId,
      name: session.classType.name,
      fillTotal: 0,
      classes: 0,
      waitlist: 0
    }
    classEntry.fillTotal += fill
    classEntry.classes += 1
    classEntry.waitlist += session._count.waitlists
    byClassTypeMap.set(session.classTypeId, classEntry)
  }
  const totalCapacity = classSessions.reduce((sum, session) => sum + session.capacity, 0)
  const overallAverageFill =
    classSessions.length > 0
      ? Math.round(
          classSessions.reduce((sum, session) => {
            const attendedCount = session.bookings.filter((booking) => ATTENDED_BOOKING_STATUSES.has(booking.status)).length
            return sum + (session.capacity > 0 ? (attendedCount / session.capacity) * 100 : 0)
          }, 0) / classSessions.length
        )
      : 0

  const statusCounts: Record<string, number> = {}
  for (const booking of bookings) {
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
  }

  const byTimeSlot = Array.from(byTimeSlotMap.values())
    .map((item) => ({
      time: item.time,
      fill: item.classes > 0 ? Math.round(item.fillTotal / item.classes) : 0,
      classes: item.classes
    }))
    .sort((a, b) => b.fill - a.fill)

  const byDay = Array.from(byDayMap.values()).map((item) => ({
    day: item.day,
    fill: item.classes > 0 ? Math.round(item.fillTotal / item.classes) : 0,
    classes: item.classes
  }))

  const classFillRows = Array.from(byClassTypeMap.values()).map((item) => ({
    id: item.id,
    name: item.name,
    fill: item.classes > 0 ? Math.round(item.fillTotal / item.classes) : 0,
    waitlist: item.waitlist
  }))

  const topClasses = [...classFillRows]
    .sort((a, b) => b.fill - a.fill)
    .slice(0, 5)

  const underperforming = [...classFillRows]
    .filter((item) => item.fill < overallAverageFill)
    .sort((a, b) => a.fill - b.fill)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      fill: item.fill,
      avgFill: overallAverageFill
    }))

  return NextResponse.json({
    revenue: {
      total: totalRevenue,
      previousTotal: previousTotalRevenue,
      byLocation: Object.entries(revenueByLocation).map(([name, amount]) => ({ name, amount })),
      byClassType: Object.entries(revenueByClassType).map(([name, amount]) => ({ name, amount })),
      monthly: Array.from(monthlyRevenueMap.values())
    },
    clients: {
      total: totalClients,
      new: newClients,
      active: activeClients,
      churned: churnedClients
    },
    classes: {
      total: classSessions.length,
      totalCapacity,
      byLocation: Object.entries(classesByLocation).map(([name, count]) => ({ name, count })),
      byTeacher: Object.entries(classesByTeacher).map(([name, count]) => ({ name, count })),
      byTimeSlot,
      byDay,
      topClasses,
      underperforming
    },
    bookings: {
      total: bookings.length,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    }
  })
}

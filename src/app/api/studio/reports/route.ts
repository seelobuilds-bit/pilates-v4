import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

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
      createdAt: { gte: startDate }
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
      createdAt: {
        gte: previousStartDate,
        lt: startDate
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
      createdAt: { gte: monthWindowStart }
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
    const amount = booking.paidAmount || booking.classSession.classType.price
    totalRevenue += amount

    const locationName = booking.classSession.location.name
    revenueByLocation[locationName] = (revenueByLocation[locationName] || 0) + amount

    const className = booking.classSession.classType.name
    revenueByClassType[className] = (revenueByClassType[className] || 0) + amount
  }

  const previousTotalRevenue = previousBookings.reduce((sum, booking) => {
    if (booking.status === "CANCELLED") return sum
    const amount = booking.paidAmount || booking.classSession.classType.price
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
    const date = new Date(booking.createdAt)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthlyRevenueMap.get(key)
    if (!bucket) continue
    const amount = booking.paidAmount || booking.classSession.classType.price
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
      teacher: { include: { user: true } }
    }
  })

  const classesByLocation: Record<string, number> = {}
  const classesByTeacher: Record<string, number> = {}

  for (const session of classSessions) {
    classesByLocation[session.location.name] = (classesByLocation[session.location.name] || 0) + 1
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`
    classesByTeacher[teacherName] = (classesByTeacher[teacherName] || 0) + 1
  }
  const totalCapacity = classSessions.reduce((sum, session) => sum + session.capacity, 0)

  const statusCounts: Record<string, number> = {}
  for (const booking of bookings) {
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
  }

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
      byTimeSlot: [],
      byDay: [],
      topClasses: [],
      underperforming: []
    },
    bookings: {
      total: bookings.length,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    }
  })
}

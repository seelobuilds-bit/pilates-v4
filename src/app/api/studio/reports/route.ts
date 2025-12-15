import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studioId = session.user.studioId
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get("days") || "30")
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

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

  const revenueByLocation: Record<string, number> = {}
  const revenueByClassType: Record<string, number> = {}
  let totalRevenue = 0

  for (const booking of bookings) {
    const amount = booking.paidAmount || booking.classSession.classType.price
    totalRevenue += amount

    const locationName = booking.classSession.location.name
    revenueByLocation[locationName] = (revenueByLocation[locationName] || 0) + amount

    const className = booking.classSession.classType.name
    revenueByClassType[className] = (revenueByClassType[className] || 0) + amount
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

  const bookingsByStatus = await db.booking.groupBy({
    by: ["status"],
    where: {
      studioId,
      createdAt: { gte: startDate }
    },
    _count: true
  })

  return NextResponse.json({
    revenue: {
      total: totalRevenue,
      byLocation: Object.entries(revenueByLocation).map(([name, amount]) => ({ name, amount })),
      byClassType: Object.entries(revenueByClassType).map(([name, amount]) => ({ name, amount }))
    },
    clients: {
      total: totalClients,
      new: newClients,
      active: activeClients,
      churned: churnedClients
    },
    classes: {
      total: classSessions.length,
      byLocation: Object.entries(classesByLocation).map(([name, count]) => ({ name, count })),
      byTeacher: Object.entries(classesByTeacher).map(([name, count]) => ({ name, count }))
    },
    bookings: {
      total: bookings.length,
      byStatus: bookingsByStatus.map(b => ({ status: b.status, count: b._count }))
    }
  })
}

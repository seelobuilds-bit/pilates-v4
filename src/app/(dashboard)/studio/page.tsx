import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { DashboardView } from "@/components/studio"
import type { DashboardData } from "@/components/studio"

export default async function StudioDashboardPage() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    redirect("/login")
  }

  const studioId = session.user.studioId

  // Get current date info
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    clientCount, 
    totalClients, 
    bookingCount, 
    weekBookings, 
    todayBookings,
    upcomingClasses,
    todayClasses,
    recentBookings,
    newClientsThisWeek,
    locations,
    teachers,
    classTypes
  ] = await Promise.all([
    db.client.count({ where: { studioId, isActive: true } }),
    db.client.count({ where: { studioId } }),
    db.booking.count({ where: { studioId } }),
    db.booking.count({ 
      where: { 
        studioId,
        createdAt: { gte: sevenDaysAgo }
      } 
    }),
    db.booking.count({
      where: {
        studioId,
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    }),
    db.classSession.findMany({
      where: { 
        studioId,
        startTime: { gte: now }
      },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" },
      take: 5
    }),
    db.classSession.findMany({
      where: {
        studioId,
        startTime: { gte: startOfToday, lte: endOfToday }
      },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" }
    }),
    db.booking.findMany({
      where: { studioId },
      include: {
        client: true,
        classSession: { include: { classType: true, location: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    db.client.count({
      where: {
        studioId,
        createdAt: { gte: sevenDaysAgo }
      }
    }),
    db.location.findMany({ where: { studioId, isActive: true } }),
    db.teacher.findMany({ 
      where: { studioId, isActive: true },
      include: { user: true }
    }),
    db.classType.findMany({ where: { studioId } })
  ])

  // Calculate churn (clients who haven't booked in 30 days)
  const activeClientsWithRecentBookings = await db.client.count({
    where: {
      studioId,
      bookings: {
        some: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    }
  })
  const churnRate = totalClients > 0 
    ? ((totalClients - activeClientsWithRecentBookings) / totalClients * 100).toFixed(1)
    : "0.0"

  // Calculate today's stats
  const todayTotalCapacity = todayClasses.reduce((sum, c) => sum + c.capacity, 0)
  const todayTotalBookings = todayClasses.reduce((sum, c) => sum + c._count.bookings, 0)
  const todayFillRate = todayTotalCapacity > 0 ? Math.round((todayTotalBookings / todayTotalCapacity) * 100) : 0

  // Get at-risk clients (haven't booked in 21+ days but were active before)
  const atRiskClients = await db.client.findMany({
    where: {
      studioId,
      isActive: true,
      bookings: {
        some: {},
        none: {
          createdAt: { gte: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000) }
        }
      }
    },
    take: 5,
    orderBy: { createdAt: "desc" }
  })

  // Get greeting based on time
  const getGreeting = () => {
    const hour = now.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // Mock revenue data (in production this would come from payments)
  const mockRevenue = {
    today: 450,
    thisWeek: 2850,
    thisMonth: 12450,
    percentChange: 8.5
  }

  // Build the dashboard data object
  const dashboardData: DashboardData = {
    greeting: getGreeting(),
    currentDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    stats: {
      monthlyRevenue: mockRevenue.thisMonth,
      revenueChange: mockRevenue.percentChange,
      activeClients: clientCount,
      newClientsThisWeek: newClientsThisWeek,
      weekBookings: weekBookings,
      todayBookings: todayBookings,
      atRiskClientsCount: atRiskClients.length,
      churnRate: churnRate
    },
    todayOverview: {
      classCount: todayClasses.length,
      bookingsCount: todayTotalBookings,
      fillRate: todayFillRate
    },
    todayClasses: todayClasses.map(c => ({
      id: c.id,
      startTime: c.startTime,
      endTime: c.endTime,
      capacity: c.capacity,
      classType: { id: c.classType.id, name: c.classType.name, color: null },
      teacher: { user: { firstName: c.teacher.user.firstName, lastName: c.teacher.user.lastName } },
      location: { id: c.location.id, name: c.location.name },
      _count: { bookings: c._count.bookings }
    })),
    upcomingClasses: upcomingClasses.map(c => ({
      id: c.id,
      startTime: c.startTime,
      endTime: c.endTime,
      capacity: c.capacity,
      classType: { id: c.classType.id, name: c.classType.name, color: null },
      teacher: { user: { firstName: c.teacher.user.firstName, lastName: c.teacher.user.lastName } },
      location: { id: c.location.id, name: c.location.name },
      _count: { bookings: c._count.bookings }
    })),
    recentBookings: recentBookings.map(b => ({
      id: b.id,
      status: b.status,
      createdAt: b.createdAt,
      client: { firstName: b.client.firstName, lastName: b.client.lastName },
      classSession: { 
        classType: { name: b.classSession.classType.name },
        location: { name: b.classSession.location.name }
      }
    })),
    atRiskClients: atRiskClients.map(c => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      createdAt: c.createdAt
    })),
    studioStats: {
      locations: locations.length,
      teachers: teachers.length,
      classTypes: classTypes.length,
      totalClients: totalClients,
      totalBookings: bookingCount
    }
  }

  return <DashboardView data={dashboardData} linkPrefix="/studio" />
}

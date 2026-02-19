import { db } from "@/lib/db"
import { DashboardView } from "@/components/studio"
import type { DashboardData } from "@/components/studio"

// Demo uses data from a real studio (Zenith) to always reflect the current state
const DEMO_STUDIO_SUBDOMAIN = process.env.DEMO_STUDIO_SUBDOMAIN || "zenith"

export default async function DemoDashboardPage() {
  // Find the demo studio
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  const studioId = studio.id
  const studioCurrency = (studio.stripeCurrency || "usd").toLowerCase()

  // Get current date info
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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
    classTypes,
    classesThisMonth
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
    db.classType.findMany({ where: { studioId } }),
    db.classSession.findMany({
      where: {
        studioId,
        startTime: { gte: startOfMonth }
      },
      select: {
        capacity: true,
        _count: { select: { bookings: true } }
      }
    })
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

  const reportPeriodCapacity = classesThisMonth.reduce((sum, c) => sum + c.capacity, 0)
  const reportPeriodBookings = classesThisMonth.reduce((sum, c) => sum + c._count.bookings, 0)
  const reportPeriodFillRate = reportPeriodCapacity > 0 ? Math.round((reportPeriodBookings / reportPeriodCapacity) * 100) : 0

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
    currency: studioCurrency,
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
    },
    reportDatapoints: [
      {
        id: "revenueGrowth",
        title: "Revenue Growth",
        value: `${mockRevenue.percentChange > 0 ? "+" : ""}${mockRevenue.percentChange}%`,
        description: "Report datapoint"
      },
      {
        id: "avgFillRate",
        title: "Avg Fill Rate",
        value: `${reportPeriodFillRate}%`,
        description: "Report datapoint"
      },
      {
        id: "classesThisMonth",
        title: "Classes This Month",
        value: classesThisMonth.length,
        description: "Report datapoint"
      },
      {
        id: "totalClients",
        title: "Total Clients",
        value: totalClients,
        description: "Report datapoint"
      },
      {
        id: "bookingsThisMonth",
        title: "Bookings This Month",
        value: reportPeriodBookings,
        description: "Report datapoint"
      },
      {
        id: "activeTeachers",
        title: "Active Teachers",
        value: teachers.length,
        description: "Report datapoint"
      }
    ]
  }

  return <DashboardView data={dashboardData} linkPrefix="/demo" />
}




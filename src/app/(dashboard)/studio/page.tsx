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

  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: { stripeCurrency: true }
  })
  const studioCurrency = (studio?.stripeCurrency || "usd").toLowerCase()

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

  // ====== REAL REVENUE CALCULATION ======
  // Get start of previous month for comparison
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  // Fetch real payment data from Payment table (amount is in cents)
  const [thisMonthPayments, lastMonthPayments, thisMonthBookingRevenue, lastMonthBookingRevenue] = await Promise.all([
    // Payments this month (SUCCEEDED only)
    db.payment.aggregate({
      where: {
        studioId,
        status: "SUCCEEDED",
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    }),
    // Payments last month for comparison
    db.payment.aggregate({
      where: {
        studioId,
        status: "SUCCEEDED",
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      },
      _sum: { amount: true }
    }),
    // Also check bookings.paidAmount for legacy/direct payments (this month)
    db.booking.aggregate({
      where: {
        studioId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        paidAmount: { not: null },
        paymentId: null, // Only count if no linked Payment (avoid double counting)
        createdAt: { gte: startOfMonth }
      },
      _sum: { paidAmount: true }
    }),
    // Last month booking revenue for comparison
    db.booking.aggregate({
      where: {
        studioId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        paidAmount: { not: null },
        paymentId: null,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      },
      _sum: { paidAmount: true }
    })
  ])

  // Calculate total revenue (Payment amount is in cents, convert to dollars)
  const paymentRevenue = (thisMonthPayments._sum.amount || 0) / 100
  const bookingRevenue = thisMonthBookingRevenue._sum.paidAmount || 0
  const thisMonthRevenue = paymentRevenue + bookingRevenue

  const lastMonthPaymentRevenue = (lastMonthPayments._sum.amount || 0) / 100
  const lastMonthBookingRevenueTotal = lastMonthBookingRevenue._sum.paidAmount || 0
  const lastMonthTotal = lastMonthPaymentRevenue + lastMonthBookingRevenueTotal

  // Calculate percent change (avoid division by zero)
  const revenuePercentChange = lastMonthTotal > 0 
    ? ((thisMonthRevenue - lastMonthTotal) / lastMonthTotal * 100)
    : (thisMonthRevenue > 0 ? 100 : 0)

  const revenue = {
    thisMonth: thisMonthRevenue,
    percentChange: Math.round(revenuePercentChange * 10) / 10 // Round to 1 decimal
  }

  // Build the dashboard data object
  const dashboardData: DashboardData = {
    greeting: getGreeting(),
    currentDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    currency: studioCurrency,
    stats: {
      monthlyRevenue: revenue.thisMonth,
      revenueChange: revenue.percentChange,
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
        value: `${revenue.percentChange > 0 ? "+" : ""}${revenue.percentChange}%`,
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

  return <DashboardView data={dashboardData} linkPrefix="/studio" />
}

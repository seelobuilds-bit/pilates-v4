import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"
import { getSession } from "@/lib/session"
import { DashboardView } from "@/components/studio"
import type { DashboardData } from "@/components/studio"

const DAY_IN_MS = 1000 * 60 * 60 * 24
const DEFAULT_DASHBOARD_PERIOD = "this_month"

type DashboardPeriod = "today" | "this_month" | "7" | "30" | "90" | "365" | "custom"

type ResolvedRange = {
  key: DashboardPeriod
  label: string
  compareLabel: string
  startDate: Date
  endDate: Date
  startDateISO: string
  endDateISO: string
}

function dateOnlyISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDateInput(value?: string) {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function resolveDashboardRange(
  now: Date,
  rawSearchParams: Record<string, string | string[] | undefined>
): ResolvedRange {
  const periodRaw = rawSearchParams.period
  const period = (Array.isArray(periodRaw) ? periodRaw[0] : periodRaw) || DEFAULT_DASHBOARD_PERIOD
  const periodKey: DashboardPeriod = ["today", "this_month", "7", "30", "90", "365", "custom"].includes(period)
    ? (period as DashboardPeriod)
    : DEFAULT_DASHBOARD_PERIOD

  const customStartRaw = rawSearchParams.startDate
  const customEndRaw = rawSearchParams.endDate
  const customStartDate = parseDateInput(Array.isArray(customStartRaw) ? customStartRaw[0] : customStartRaw)
  const customEndDate = parseDateInput(Array.isArray(customEndRaw) ? customEndRaw[0] : customEndRaw)

  if (periodKey === "custom" && customStartDate && customEndDate && customStartDate <= customEndDate) {
    const startDate = new Date(customStartDate)
    const endDate = new Date(customEndDate)
    endDate.setUTCDate(endDate.getUTCDate() + 1)
    return {
      key: "custom",
      label: `${dateOnlyISO(startDate)} - ${dateOnlyISO(customEndDate)}`,
      compareLabel: "previous period",
      startDate,
      endDate,
      startDateISO: dateOnlyISO(startDate),
      endDateISO: dateOnlyISO(customEndDate),
    }
  }

  if (periodKey === "today") {
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return {
      key: "today",
      label: "Today",
      compareLabel: "yesterday",
      startDate,
      endDate: now,
      startDateISO: dateOnlyISO(startDate),
      endDateISO: dateOnlyISO(now),
    }
  }

  if (periodKey === "this_month") {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      key: "this_month",
      label: "This month",
      compareLabel: "same period last month",
      startDate,
      endDate: now,
      startDateISO: dateOnlyISO(startDate),
      endDateISO: dateOnlyISO(now),
    }
  }

  const days = Number.parseInt(periodKey, 10)
  const resolvedDays = Number.isFinite(days) && days > 0 ? days : 30
  const startDate = new Date(now.getTime() - resolvedDays * DAY_IN_MS)
  return {
    key: periodKey,
    label: `Last ${resolvedDays} days`,
    compareLabel: `previous ${resolvedDays} days`,
    startDate,
    endDate: now,
    startDateISO: dateOnlyISO(startDate),
    endDateISO: dateOnlyISO(now),
  }
}

export default async function StudioDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
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
  const resolvedSearchParams = await searchParams
  const selectedRange = resolveDashboardRange(now, resolvedSearchParams)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    clientCount,
    totalClients,
    bookingCount,
    periodBookings,
    todayBookings,
    newClientsInPeriod,
    locationsCount,
    teachersCount,
    classTypesCount
  ] = await runDbQueries([
    () => db.client.count({ where: { studioId, isActive: true } }),
    () => db.client.count({ where: { studioId } }),
    () => db.booking.count({ where: { studioId } }),
    () => db.booking.count({
      where: {
        studioId,
        status: { not: "CANCELLED" },
        classSession: {
          startTime: {
            gte: selectedRange.startDate,
            lt: selectedRange.endDate,
          },
        },
      }
    }),
    () => db.booking.count({
      where: {
        studioId,
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    }),
    () => db.client.count({
      where: {
        studioId,
        createdAt: {
          gte: selectedRange.startDate,
          lt: selectedRange.endDate,
        }
      }
    }),
    () => db.location.count({ where: { studioId, isActive: true } }),
    () => db.teacher.count({ where: { studioId, isActive: true } }),
    () => db.classType.count({ where: { studioId } })
  ])

  const [upcomingClasses, todayClasses, recentBookings, classesInPeriod] = await runDbQueries([
    () => db.classSession.findMany({
      where: { 
        studioId,
        startTime: { gte: now }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        capacity: true,
        classType: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        },
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" },
      take: 5
    }),
    () => db.classSession.findMany({
      where: {
        studioId,
        startTime: { gte: startOfToday, lte: endOfToday }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        capacity: true,
        classType: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        },
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" }
    }),
    () => db.booking.findMany({
      where: { studioId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        classSession: {
          select: {
            classType: {
              select: {
                name: true
              }
            },
            location: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    () => db.classSession.findMany({
      where: {
        studioId,
        startTime: {
          gte: selectedRange.startDate,
          lt: selectedRange.endDate,
        }
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

  const reportPeriodCapacity = classesInPeriod.reduce((sum, c) => sum + c.capacity, 0)
  const reportPeriodBookings = classesInPeriod.reduce((sum, c) => sum + c._count.bookings, 0)
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

  // ====== REVENUE CALCULATION (aligned with reports period logic) ======
  const periodDuration = selectedRange.endDate.getTime() - selectedRange.startDate.getTime()
  const previousPeriodStart = new Date(selectedRange.startDate.getTime() - periodDuration)
  const previousPeriodEnd = selectedRange.startDate

  const [thisPeriodRevenueBookings, previousPeriodRevenueBookings] = await runDbQueries([
    () => db.booking.findMany({
      where: {
        studioId,
        status: { not: "CANCELLED" },
        classSession: {
          startTime: { gte: selectedRange.startDate, lt: selectedRange.endDate }
        }
      },
      select: {
        paidAmount: true,
        classSession: {
          select: {
            classType: { select: { price: true } }
          }
        }
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        status: { not: "CANCELLED" },
        classSession: {
          startTime: { gte: previousPeriodStart, lt: previousPeriodEnd }
        }
      },
      select: {
        paidAmount: true,
        classSession: {
          select: {
            classType: { select: { price: true } }
          }
        }
      }
    })
  ])

  const periodRevenue = thisPeriodRevenueBookings.reduce((sum, booking) => {
    return sum + (booking.paidAmount ?? booking.classSession.classType.price ?? 0)
  }, 0)

  const previousPeriodRevenue = previousPeriodRevenueBookings.reduce((sum, booking) => {
    return sum + (booking.paidAmount ?? booking.classSession.classType.price ?? 0)
  }, 0)

  // Calculate percent change (avoid division by zero)
  const revenuePercentChange = previousPeriodRevenue > 0 
    ? ((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100)
    : (periodRevenue > 0 ? 100 : 0)

  const revenue = {
    thisPeriod: periodRevenue,
    percentChange: Math.round(revenuePercentChange * 10) / 10 // Round to 1 decimal
  }

  // Build the dashboard data object
  const dashboardData: DashboardData = {
    greeting: getGreeting(),
    currentDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    currency: studioCurrency,
    selectedRange: {
      key: selectedRange.key,
      label: selectedRange.label,
      compareLabel: selectedRange.compareLabel,
      startDate: selectedRange.startDateISO,
      endDate: selectedRange.endDateISO,
    },
    stats: {
      monthlyRevenue: revenue.thisPeriod,
      revenueChange: revenue.percentChange,
      activeClients: clientCount,
      newClientsThisWeek: newClientsInPeriod,
      weekBookings: periodBookings,
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
      locations: locationsCount,
      teachers: teachersCount,
      classTypes: classTypesCount,
      totalClients: totalClients,
      totalBookings: bookingCount
    },
    reportDatapoints: [
      {
        id: "revenueGrowth",
        title: "Revenue Growth",
        value: `${revenue.percentChange > 0 ? "+" : ""}${revenue.percentChange}%`,
        description: `vs ${selectedRange.compareLabel}`
      },
      {
        id: "avgFillRate",
        title: "Avg Fill Rate",
        value: `${reportPeriodFillRate}%`,
        description: selectedRange.label
      },
      {
        id: "classesThisMonth",
        title: "Classes in Period",
        value: classesInPeriod.length,
        description: selectedRange.label
      },
      {
        id: "totalClients",
        title: "Total Clients",
        value: totalClients,
        description: "Report datapoint"
      },
      {
        id: "bookingsThisMonth",
        title: "Bookings in Period",
        value: reportPeriodBookings,
        description: selectedRange.label
      },
      {
        id: "activeTeachers",
        title: "Active Teachers",
        value: teachersCount,
        description: "Report datapoint"
      }
    ]
  }

  return <DashboardView data={dashboardData} linkPrefix="/studio" />
}

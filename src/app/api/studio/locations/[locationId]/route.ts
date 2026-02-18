import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const DEFAULT_REPORT_PERIOD_DAYS = 30
const ALLOWED_DAY_PRESETS = new Set([7, 30, 90])

function getReportDateRange(searchParams: URLSearchParams) {
  const startDateParam = searchParams.get("startDate")
  const endDateParam = searchParams.get("endDate")

  if (startDateParam && endDateParam) {
    const start = new Date(`${startDateParam}T00:00:00.000Z`)
    const end = new Date(`${endDateParam}T23:59:59.999Z`)

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      return { startDate: start, endDate: end }
    }
  }

  const parsedDays = Number.parseInt(searchParams.get("days") || "", 10)
  const days = ALLOWED_DAY_PRESETS.has(parsedDays) ? parsedDays : DEFAULT_REPORT_PERIOD_DAYS

  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (days - 1))

  return { startDate, endDate }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { locationId } = await params
  const { startDate, endDate } = getReportDateRange(request.nextUrl.searchParams)
  const location = await db.location.findFirst({
    where: {
      id: locationId,
      studioId: session.user.studioId
    }
  })

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  const classSessions = await db.classSession.findMany({
    where: {
      studioId: session.user.studioId,
      locationId,
      startTime: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      classType: { select: { name: true } },
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      },
      _count: {
        select: { bookings: true }
      }
    },
    orderBy: { startTime: "desc" }
  })

  const bookings = await db.booking.findMany({
    where: {
      studioId: session.user.studioId,
      classSession: {
        locationId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          isActive: true
        }
      },
      classSession: {
        include: {
          classType: { select: { name: true, price: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const nonCancelledBookings = bookings.filter((booking) => booking.status !== "CANCELLED")
  const totalRevenue = nonCancelledBookings.reduce((sum, booking) => {
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    return sum + amount
  }, 0)

  const activeClientIds = new Set(
    nonCancelledBookings.filter((booking) => booking.client.isActive).map((booking) => booking.clientId)
  )

  const classCounts = new Map<string, number>()
  const teacherCounts = new Map<string, number>()
  const bookingsByDayMap = new Map<string, number>([
    ["Sun", 0],
    ["Mon", 0],
    ["Tue", 0],
    ["Wed", 0],
    ["Thu", 0],
    ["Fri", 0],
    ["Sat", 0]
  ])

  for (const booking of nonCancelledBookings) {
    const className = booking.classSession.classType.name
    classCounts.set(className, (classCounts.get(className) || 0) + 1)

    const dayKey = new Date(booking.classSession.startTime).toLocaleDateString("en-US", { weekday: "short" })
    bookingsByDayMap.set(dayKey, (bookingsByDayMap.get(dayKey) || 0) + 1)
  }

  for (const session of classSessions) {
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`.trim()
    teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1)
  }

  const bucketEndDate = new Date(endDate)
  const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(bucketEndDate.getFullYear(), bucketEndDate.getMonth() - 5 + index, 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0
    }
  })
  const monthlyLookup = new Map(monthlyBuckets.map((bucket) => [bucket.key, bucket]))

  for (const booking of nonCancelledBookings) {
    const date = new Date(booking.classSession.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthlyLookup.get(key)
    if (bucket) {
      bucket.revenue += booking.paidAmount ?? booking.classSession.classType.price ?? 0
    }
  }

  const stats = {
    totalBookings: nonCancelledBookings.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    activeClients: activeClientIds.size,
    avgClassSize:
      classSessions.length > 0
        ? Math.round((nonCancelledBookings.length / classSessions.length) * 10) / 10
        : 0,
    topClasses: Array.from(classCounts.entries())
      .map(([name, bookingsCount]) => ({ name, bookings: bookingsCount }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5),
    topTeachers: Array.from(teacherCounts.entries())
      .map(([name, classes]) => ({ name, classes, rating: null }))
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 5),
    ratingDataAvailable: false,
    recentBookings: nonCancelledBookings.slice(0, 10).map((booking) => ({
      clientName: `${booking.client.firstName} ${booking.client.lastName}`.trim(),
      className: booking.classSession.classType.name,
      date: new Date(booking.createdAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    })),
    bookingsByDay: Array.from(bookingsByDayMap.entries()).map(([day, count]) => ({ day, count })),
    monthlyRevenue: monthlyBuckets.map(({ month, revenue }) => ({
      month,
      revenue: Math.round(revenue * 100) / 100
    }))
  }

  return NextResponse.json({
    ...location,
    stats
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { locationId } = await params
    const body = await request.json()
    const { name, address, city, state, zipCode, isActive } = body

    const location = await db.location.updateMany({
      where: {
        id: locationId,
        studioId: session.user.studioId
      },
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        isActive
      }
    })

    if (location.count === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

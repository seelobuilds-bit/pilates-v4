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
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { classTypeId } = await params
  const { startDate, endDate } = getReportDateRange(request.nextUrl.searchParams)
  const classType = await db.classType.findFirst({
    where: {
      id: classTypeId,
      studioId: session.user.studioId
    }
  })

  if (!classType) {
    return NextResponse.json({ error: "Class type not found" }, { status: 404 })
  }

  const classSessions = await db.classSession.findMany({
    where: {
      studioId: session.user.studioId,
      classTypeId,
      startTime: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
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
      location: {
        select: { name: true }
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
        classTypeId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    include: {
      classSession: {
        include: {
          location: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const nonCancelledBookings = bookings.filter((booking) => booking.status !== "CANCELLED")
  const totalRevenue = nonCancelledBookings.reduce((sum, booking) => {
    const amount = booking.paidAmount ?? classType.price ?? 0
    return sum + amount
  }, 0)

  const teacherCounts = new Map<string, number>()
  const locationBookingCounts = new Map<string, number>()
  const timeSlotCounts = new Map<string, number>()

  for (const session of classSessions) {
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`.trim()
    teacherCounts.set(teacherName, (teacherCounts.get(teacherName) || 0) + 1)

    const slot = new Date(session.startTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })
    timeSlotCounts.set(slot, (timeSlotCounts.get(slot) || 0) + 1)
  }

  for (const booking of nonCancelledBookings) {
    const locationName = booking.classSession.location.name
    locationBookingCounts.set(locationName, (locationBookingCounts.get(locationName) || 0) + 1)
  }

  const bucketEndDate = new Date(endDate)
  const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(bucketEndDate.getFullYear(), bucketEndDate.getMonth() - 5 + index, 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      count: 0
    }
  })
  const monthlyLookup = new Map(monthlyBuckets.map((bucket) => [bucket.key, bucket]))

  for (const booking of nonCancelledBookings) {
    const date = new Date(booking.classSession.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthlyLookup.get(key)
    if (bucket) {
      bucket.count += 1
    }
  }

  const recentClasses = classSessions.slice(0, 10).map((session) => ({
    date: new Date(session.startTime).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    teacher: `${session.teacher.user.firstName} ${session.teacher.user.lastName}`.trim(),
    location: session.location.name,
    attendance: session._count.bookings,
    capacity: session.capacity
  }))

  const stats = {
    totalBookings: bookings.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    avgAttendance:
      classSessions.length > 0
        ? Math.round((nonCancelledBookings.length / classSessions.length) * 10) / 10
        : 0,
    avgRating: null,
    ratingDataAvailable: false,
    topTeachers: Array.from(teacherCounts.entries())
      .map(([name, classes]) => ({ name, classes, rating: null }))
      .sort((a, b) => b.classes - a.classes)
      .slice(0, 5),
    topLocations: Array.from(locationBookingCounts.entries())
      .map(([name, bookingsCount]) => ({ name, bookings: bookingsCount }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5),
    monthlyBookings: monthlyBuckets.map(({ month, count }) => ({ month, count })),
    popularTimes: Array.from(timeSlotCounts.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    recentClasses
  }

  const locationIds = Array.from(new Set(classSessions.map((session) => session.locationId)))
  const teacherIds = Array.from(new Set(classSessions.map((session) => session.teacherId)))

  return NextResponse.json({
    ...classType,
    stats,
    locationIds,
    teacherIds
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { classTypeId } = await params
    const body = await request.json()
    const { name, description, duration, capacity, price, isActive } = body

    const classType = await db.classType.updateMany({
      where: {
        id: classTypeId,
        studioId: session.user.studioId
      },
      data: {
        name,
        description,
        duration,
        capacity,
        price,
        isActive
      }
    })

    if (classType.count === 0) {
      return NextResponse.json({ error: "Class type not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update class type:", error)
    return NextResponse.json({ error: "Failed to update class type" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildClassTypeEntityStats } from "@/lib/reporting/class-type-entity"
import { getSession } from "@/lib/session"

const DEFAULT_REPORT_PERIOD_DAYS = 30
const ALLOWED_DAY_PRESETS = new Set([7, 30, 90])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { classTypeId } = await params
  const { startDate, endDate } = resolveEntityReportDateRange(request.nextUrl.searchParams, {
    defaultDays: DEFAULT_REPORT_PERIOD_DAYS,
    allowedDays: Array.from(ALLOWED_DAY_PRESETS),
  })
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

  const stats = buildClassTypeEntityStats({
    classSessions,
    bookings,
    classPrice: classType.price,
    endDate,
  })

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

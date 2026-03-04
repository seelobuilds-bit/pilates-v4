import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildLocationEntityStats } from "@/lib/reporting/location-entity"

const DEFAULT_REPORT_PERIOD_DAYS = 30
const ALLOWED_DAY_PRESETS = new Set([7, 30, 90])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const { locationId } = await params
  const { startDate, endDate } = resolveEntityReportDateRange(request.nextUrl.searchParams, {
    defaultDays: DEFAULT_REPORT_PERIOD_DAYS,
    allowedDays: Array.from(ALLOWED_DAY_PRESETS),
  })
  const location = await db.location.findFirst({
    where: {
      id: locationId,
      studioId,
    },
  })

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  const classSessions = await db.classSession.findMany({
    where: {
      studioId,
      locationId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      classType: { select: { name: true } },
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { startTime: "desc" },
  })

  const bookings = await db.booking.findMany({
    where: {
      studioId,
      classSession: {
        locationId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          isActive: true,
        },
      },
      classSession: {
        include: {
          classType: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = buildLocationEntityStats({
    classSessions,
    bookings,
    endDate,
  })

  return NextResponse.json({
    ...location,
    stats,
  })
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildLocationEntityResponse } from "@/lib/reporting/entity-response"
import { buildLocationEntityStats } from "@/lib/reporting/location-entity"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const { locationId } = await params
  const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)
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

  return NextResponse.json(
    buildLocationEntityResponse({
      location,
      stats,
    })
  )
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildLocationEntityStats } from "@/lib/reporting/location-entity"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { locationId } = await params
  const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)
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

  const stats = buildLocationEntityStats({
    classSessions,
    bookings,
    endDate,
  })

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

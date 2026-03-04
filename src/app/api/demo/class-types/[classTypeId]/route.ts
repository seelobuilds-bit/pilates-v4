import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildClassTypeEntityResponse } from "@/lib/reporting/entity-response"
import { buildClassTypeEntityStats } from "@/lib/reporting/class-type-entity"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const { classTypeId } = await params
  const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)
  const classType = await db.classType.findFirst({
    where: {
      id: classTypeId,
      studioId,
    },
  })

  if (!classType) {
    return NextResponse.json({ error: "Class type not found" }, { status: 404 })
  }

  const classSessions = await db.classSession.findMany({
    where: {
      studioId,
      classTypeId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
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
      location: {
        select: { name: true },
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
        classTypeId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      classSession: {
        include: {
          location: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = buildClassTypeEntityStats({
    classSessions,
    bookings,
    classPrice: classType.price,
    endDate,
  })

  const locationIds = Array.from(new Set(classSessions.map((session) => session.locationId)))
  const teacherIds = Array.from(new Set(classSessions.map((session) => session.teacherId)))

  return NextResponse.json(
    buildClassTypeEntityResponse({
      classType,
      stats,
      locationIds,
      teacherIds,
    })
  )
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

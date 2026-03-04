import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"
import { filterByInclusiveDateRange, resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildTeacherEntityResponse } from "@/lib/reporting/entity-response"
import { buildTeacherEntityReportSummary } from "@/lib/reporting/teacher-entity"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not found" }, { status: 404 })
    }

    const { teacherId } = await params
    const { startDate, endDate } = resolveDefaultEntityReportDateRange(request.nextUrl.searchParams)

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, studioId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        classSessions: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: "asc" },
          take: 5,
          include: {
            classType: { select: { name: true } },
            location: { select: { name: true } },
            _count: { select: { bookings: true } }
          }
        },
        _count: { select: { classSessions: true } }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const allClassSessions = await db.classSession.findMany({
      where: { teacherId: teacher.id, studioId },
      include: {
        classType: { select: { name: true } },
        location: { select: { name: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "desc" }
    })

    const allBookings = await db.booking.findMany({
      where: {
        studioId,
        classSession: { teacherId: teacher.id }
      },
      include: {
        classSession: {
          include: {
            classType: { select: { name: true, price: true } },
            location: { select: { name: true } }
          }
        },
        client: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    const reportClassSessions = filterByInclusiveDateRange(
      allClassSessions,
      (session) => new Date(session.startTime),
      startDate,
      endDate
    )

    const reportBookings = filterByInclusiveDateRange(
      allBookings,
      (booking) => new Date(booking.classSession.startTime),
      startDate,
      endDate
    )

    const { stats, extendedStats } = buildTeacherEntityReportSummary({
      reportClassSessions,
      reportBookings,
      allClassSessions,
      endDate,
    })

    return NextResponse.json(
      buildTeacherEntityResponse({
        teacher,
        upcomingClasses: teacher.classSessions,
        stats,
        extendedStats,
      })
    )
  } catch (error) {
    console.error("Error fetching demo teacher:", error)
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 })
  }
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

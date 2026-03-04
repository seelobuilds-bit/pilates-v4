import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildTeacherEntityResponse } from "@/lib/reporting/entity-response"
import { loadTeacherEntityReport } from "@/lib/reporting/entity-loaders"

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

    const teacherReport = await loadTeacherEntityReport({
      studioId,
      teacherId,
      startDate,
      endDate,
    })

    if (!teacherReport) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    return NextResponse.json(
      buildTeacherEntityResponse({
        teacher: teacherReport.teacher,
        upcomingClasses: teacherReport.upcomingClasses,
        stats: teacherReport.stats,
        extendedStats: teacherReport.extendedStats,
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

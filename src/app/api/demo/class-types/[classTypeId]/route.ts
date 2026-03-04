import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildClassTypeEntityResponse } from "@/lib/reporting/entity-response"
import { loadClassTypeEntityReport } from "@/lib/reporting/entity-loaders"

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
  const classTypeReport = await loadClassTypeEntityReport({
    studioId,
    classTypeId,
    startDate,
    endDate,
  })

  if (!classTypeReport) {
    return NextResponse.json({ error: "Class type not found" }, { status: 404 })
  }

  return NextResponse.json(
    buildClassTypeEntityResponse({
      classType: classTypeReport.classType,
      stats: classTypeReport.stats,
      locationIds: classTypeReport.locationIds,
      teacherIds: classTypeReport.teacherIds,
    })
  )
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

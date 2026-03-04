import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultEntityReportDateRange } from "@/lib/reporting/date-range"
import { buildLocationEntityResponse } from "@/lib/reporting/entity-response"
import { loadLocationEntityReport } from "@/lib/reporting/entity-loaders"

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
  const locationReport = await loadLocationEntityReport({
    studioId,
    locationId,
    startDate,
    endDate,
  })

  if (!locationReport) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  return NextResponse.json(
    buildLocationEntityResponse({
      location: locationReport.location,
      stats: locationReport.stats,
    })
  )
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

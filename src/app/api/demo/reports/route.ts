import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveDefaultStudioReportRange } from "@/lib/reporting/date-range"
import { buildStudioReportResponse } from "@/lib/reporting/studio-report-response"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const { days, startDate, reportEndDate, previousStartDate } = resolveDefaultStudioReportRange(
    {
      days: searchParams.get("days"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    }
  )

  return buildStudioReportResponse({
    studioId,
    days,
    startDate,
    reportEndDate,
    previousStartDate,
  })
}

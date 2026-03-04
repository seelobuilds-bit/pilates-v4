import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { resolveStudioReportRangeFromSearchParams } from "@/lib/reporting/studio-report-request"
import { buildStudioReportResponse } from "@/lib/reporting/studio-report-response"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const { days, startDate, reportEndDate, previousStartDate } = resolveStudioReportRangeFromSearchParams(
    request.nextUrl.searchParams
  )

  return buildStudioReportResponse({
    studioId,
    days,
    startDate,
    reportEndDate,
    previousStartDate,
  })
}

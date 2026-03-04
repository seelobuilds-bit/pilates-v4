import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { resolveStudioReportRangeFromSearchParams } from "@/lib/reporting/studio-report-request"
import { buildStudioReportResponse } from "@/lib/reporting/studio-report-response"

export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getSession>>
  try {
    session = await getSession()
  } catch (error) {
    console.error("Failed to resolve session for reports:", error)
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 })
  }

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studioId = session.user.studioId
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

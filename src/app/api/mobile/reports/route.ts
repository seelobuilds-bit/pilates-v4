import { NextRequest, NextResponse } from "next/server"
import { getMobileReports, MobileReportsError } from "@/lib/reporting/mobile-reports"
import type { ReportRangeInput } from "@/lib/reporting/date-range"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function handleReportRequest(request: NextRequest, input: ReportRangeInput) {
  try {
    const data = await getMobileReports(request.headers.get("authorization"), input)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof MobileReportsError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Mobile reports error:", error)
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleReportRequest(request, {
    days: request.nextUrl.searchParams.get("days"),
    startDate: request.nextUrl.searchParams.get("startDate"),
    endDate: request.nextUrl.searchParams.get("endDate"),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  return handleReportRequest(request, {
    days: body?.days != null ? String(body.days) : null,
    startDate: body?.startDate != null ? String(body.startDate) : null,
    endDate: body?.endDate != null ? String(body.endDate) : null,
  })
}

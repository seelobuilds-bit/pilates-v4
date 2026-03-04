import { NextRequest, NextResponse } from "next/server"
import {
  resolveMobileReportRangeInputFromBody,
  resolveMobileReportRangeInputFromSearchParams,
} from "@/lib/reporting/mobile-report-request"
import { resolveMobileReportRouteError } from "@/lib/reporting/mobile-report-route-errors"
import { getMobileReports } from "@/lib/reporting/mobile-reports"
import type { ReportRangeInput } from "@/lib/reporting/date-range"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function handleReportRequest(request: NextRequest, input: ReportRangeInput) {
  try {
    const data = await getMobileReports(request.headers.get("authorization"), input)
    return NextResponse.json(data)
  } catch (error) {
    const routeError = resolveMobileReportRouteError(error)
    if (routeError.log) {
      console.error("Mobile reports error:", error)
    }
    return NextResponse.json({ error: routeError.message }, { status: routeError.status })
  }
}

export async function GET(request: NextRequest) {
  return handleReportRequest(request, resolveMobileReportRangeInputFromSearchParams(request.nextUrl.searchParams))
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  return handleReportRequest(request, resolveMobileReportRangeInputFromBody(body))
}

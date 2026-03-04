import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { buildStudioReportRequestArgs } from "@/lib/reporting/studio-report-request-args"
import { buildStudioReportResponse } from "@/lib/reporting/studio-report-response"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  return buildStudioReportResponse(buildStudioReportRequestArgs(studioId, request.nextUrl.searchParams))
}

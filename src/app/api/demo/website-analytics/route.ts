import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import {
  buildWebsiteAnalyticsResponse,
  upsertWebsiteAnalyticsConfig,
} from "@/lib/website-analytics/response"

// GET - Fetch website analytics config and data
export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  return buildWebsiteAnalyticsResponse({
    studioId,
    requestedPeriod: searchParams.get("period"),
    dataType: searchParams.get("type"),
  })
}

// PATCH - Update website analytics config
export async function PATCH(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  try {
    const body = await request.json()
    const config = await upsertWebsiteAnalyticsConfig({
      studioId,
      body,
    })
    return NextResponse.json(config)
  } catch (error) {
    console.error("Failed to update website analytics config:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}








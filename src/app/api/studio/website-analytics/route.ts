import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  buildWebsiteAnalyticsResponse,
  upsertWebsiteAnalyticsConfig,
} from "@/lib/website-analytics/response"

// GET - Fetch website analytics config and data
export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getSession>>
  try {
    session = await getSession()
  } catch (error) {
    console.error("Failed to resolve session for website analytics:", error)
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 })
  }

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const studioId = session.user.studioId!

  const searchParams = request.nextUrl.searchParams
  return buildWebsiteAnalyticsResponse({
    studioId,
    requestedPeriod: searchParams.get("period"),
    dataType: searchParams.get("type"),
  })
}

// PATCH - Update website analytics config
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const config = await upsertWebsiteAnalyticsConfig({
      studioId: session.user.studioId,
      body,
    })
    return NextResponse.json(config)
  } catch (error) {
    console.error("Failed to update website analytics config:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}








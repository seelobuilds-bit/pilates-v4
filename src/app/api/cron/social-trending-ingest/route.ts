import { NextRequest, NextResponse } from "next/server"
import { ingestTrendingContent } from "@/lib/social/trending-ingest"
import { getSession } from "@/lib/session"

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    const session = await getSession()
    if (session?.user?.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await ingestTrendingContent({ limit: 120 })
    return NextResponse.json({
      ok: true,
      ...result,
      ranAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Social trending ingest cron failed:", error)
    return NextResponse.json({ error: "Failed to ingest social trending content" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { ingestTrendingContent } from "@/lib/social/trending-ingest"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = Number.isFinite(body?.limit) ? Number(body.limit) : undefined
    const result = await ingestTrendingContent({ limit })
    return NextResponse.json({
      ok: true,
      ...result,
      ingestedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to ingest trending content:", error)
    return NextResponse.json({ error: "Failed to ingest trending content" }, { status: 500 })
  }
}


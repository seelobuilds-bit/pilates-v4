import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

function extractHook(caption: string | null) {
  if (!caption) return "Pilates result transformation story"
  const cleaned = caption
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/#[\p{L}\p{N}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return "Pilates result transformation story"
  const sentence = cleaned.split(/[.!?]\s+/).find((segment) => segment.trim().length >= 12) || cleaned
  if (sentence.length <= 130) return sentence.trim()
  return `${sentence.slice(0, 127).trimEnd()}...`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    const session = await getSession()
    if (session?.user?.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const rows = await db.trendingContent.findMany({
      where: {
        isHidden: false,
        postedAt: { gte: start },
        OR: [
          { hashtags: { has: "pilates" } },
          { caption: { contains: "pilates", mode: "insensitive" } },
          { category: { contains: "pilates", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        platform: true,
        creatorUsername: true,
        postUrl: true,
        caption: true,
        trendingScore: true,
      },
      orderBy: { trendingScore: "desc" },
      take: 20,
    })

    const hooks = rows.map((row) => ({
      sourceId: row.id,
      platform: row.platform,
      creatorUsername: row.creatorUsername,
      postUrl: row.postUrl,
      hook: extractHook(row.caption),
      trendingScore: row.trendingScore,
    }))

    return NextResponse.json({
      ok: true,
      count: hooks.length,
      hooks,
      ranAt: new Date().toISOString(),
      note: "This cron generates the daily top hook list from the latest trending content.",
    })
  } catch (error) {
    console.error("Social hook cron failed:", error)
    return NextResponse.json({ error: "Failed to refresh social hooks" }, { status: 500 })
  }
}

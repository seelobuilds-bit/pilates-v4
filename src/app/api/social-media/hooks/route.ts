import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const COUNTRY_TOKEN_MAP: Record<string, string[]> = {
  "United Kingdom": ["uk", "unitedkingdom", "britain", "england", "london", "scotland", "wales"],
  Ireland: ["ireland", "irish", "dublin"],
  Australia: ["australia", "australian", "aus", "sydney", "melbourne", "brisbane", "perth"],
  "United States": ["usa", "us", "america", "newyork", "losangeles", "miami", "chicago", "california", "texas"],
  Canada: ["canada", "canadian", "toronto", "vancouver"],
  "New Zealand": ["newzealand", "nz", "auckland", "wellington"],
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "")
}

function splitTokenInput(value: string | null) {
  if (!value) return []
  return value
    .split(",")
    .map((entry) => normalizeToken(entry))
    .filter(Boolean)
}

function mapCountryTokens(country: string | null) {
  if (!country) return []
  const normalized = normalizeToken(country)
  const matchingEntry = Object.entries(COUNTRY_TOKEN_MAP).find(([label]) => normalizeToken(label) === normalized)
  if (matchingEntry) return matchingEntry[1]
  return [normalized]
}

function resolveTimeframeStart(timeframe: string | null) {
  if (!timeframe || timeframe === "all") return null

  const now = Date.now()
  switch (timeframe) {
    case "24h":
    case "daily":
      return new Date(now - 24 * 60 * 60 * 1000)
    case "7d":
    case "weekly":
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case "30d":
    case "monthly":
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
    case "90d":
      return new Date(now - 90 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}

function buildTokenFilter(tokens: string[]) {
  if (tokens.length === 0) return null

  return {
    OR: tokens.flatMap((token) => [
      { hashtags: { has: token } },
      { caption: { contains: token, mode: "insensitive" as const } },
      { creatorUsername: { contains: token, mode: "insensitive" as const } },
      { creatorDisplayName: { contains: token, mode: "insensitive" as const } },
      { category: { contains: token, mode: "insensitive" as const } },
      { contentStyle: { contains: token, mode: "insensitive" as const } },
    ]),
  }
}

function cleanupCaption(caption: string) {
  return caption
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/#[\p{L}\p{N}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractHook(caption: string | null) {
  if (!caption) return null
  const cleaned = cleanupCaption(caption)
  if (!cleaned) return null

  const sentence = cleaned.split(/[.!?]\s+/).find((segment) => segment.trim().length >= 12) || cleaned
  const trimmed = sentence.trim()
  if (!trimmed) return null
  if (trimmed.length <= 130) return trimmed
  return `${trimmed.slice(0, 127).trimEnd()}...`
}

function buildFallbackHook(caption: string | null) {
  if (!caption) return "Pilates result transformation story"
  const cleaned = cleanupCaption(caption)
  const words = cleaned.split(" ").filter(Boolean).slice(0, 14)
  if (words.length === 0) return "Pilates result transformation story"
  return words.join(" ")
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get("timeframe") || "24h"
    const platform = searchParams.get("platform")
    const country = searchParams.get("country")
    const tags = splitTokenInput(searchParams.get("tags"))
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)))

    const where: Record<string, unknown> = { isHidden: false }
    const andClauses: Record<string, unknown>[] = []

    if (platform) {
      where.platform = platform
    }

    const timeframeStart = resolveTimeframeStart(timeframe)
    if (timeframeStart) {
      where.postedAt = { gte: timeframeStart }
    }

    // Keep hook extraction constrained to Pilates-centric content.
    andClauses.push({
      OR: [
        { hashtags: { has: "pilates" } },
        { caption: { contains: "pilates", mode: "insensitive" as const } },
        { category: { contains: "pilates", mode: "insensitive" as const } },
      ],
    })

    const countryTokens = mapCountryTokens(country)
    if (countryTokens.length > 0) {
      const countryFilter = buildTokenFilter(countryTokens)
      if (countryFilter) andClauses.push(countryFilter)
    }

    if (tags.length > 0) {
      const tagFilter = buildTokenFilter(tags)
      if (tagFilter) andClauses.push(tagFilter)
    }

    if (andClauses.length > 0) {
      where.AND = andClauses
    }

    const sourceRows = await db.trendingContent.findMany({
      where,
      select: {
        id: true,
        platform: true,
        postUrl: true,
        creatorUsername: true,
        caption: true,
        hashtags: true,
        postedAt: true,
        trendingScore: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
      },
      orderBy: [
        { trendingScore: "desc" },
        { viewCount: "desc" },
      ],
      take: 250,
    })

    const dedupe = new Set<string>()
    const hooks = sourceRows
      .map((row, index) => {
        const hook = extractHook(row.caption) || buildFallbackHook(row.caption)
        return {
          id: `${row.id}:${index}`,
          sourceId: row.id,
          hook,
          platform: row.platform,
          creatorUsername: row.creatorUsername,
          postUrl: row.postUrl,
          hashtags: row.hashtags,
          postedAt: row.postedAt.toISOString(),
          trendingScore: row.trendingScore,
          stats: {
            views: row.viewCount,
            likes: row.likeCount,
            comments: row.commentCount,
          },
        }
      })
      .filter((entry) => {
        const key = normalizeToken(entry.hook)
        if (!key || dedupe.has(key)) return false
        dedupe.add(key)
        return true
      })
      .slice(0, limit)

    return NextResponse.json({
      hooks,
      generatedAt: new Date().toISOString(),
      timeframe,
      source: "trending-content",
      filtersApplied: {
        platform: platform || null,
        country: country || null,
        tags,
      },
    })
  } catch (error) {
    console.error("Failed to build daily hooks:", error)
    return NextResponse.json({ error: "Failed to build daily hooks" }, { status: 500 })
  }
}

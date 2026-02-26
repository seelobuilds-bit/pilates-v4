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

function inferCountriesFromContent(items: Array<{ hashtags: string[]; caption: string | null }>) {
  const found = new Set<string>()
  const allTokens = items.flatMap((item) => {
    const hashtagTokens = item.hashtags.map(normalizeToken)
    const captionTokens = (item.caption || "")
      .toLowerCase()
      .replace(/[^a-z0-9#\s]/g, " ")
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean)
    return [...hashtagTokens, ...captionTokens]
  })

  for (const [country, tokens] of Object.entries(COUNTRY_TOKEN_MAP)) {
    if (tokens.some((token) => allTokens.includes(token))) {
      found.add(country)
    }
  }

  return [...found].sort()
}

// GET - Fetch trending content with filters
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Filters
    const platform = searchParams.get("platform") // INSTAGRAM | TIKTOK
    const category = searchParams.get("category") // Reformer, Mat, etc.
    const contentStyle = searchParams.get("contentStyle") // Tutorial, Tips, etc.
    const timeframe = searchParams.get("timeframe") // 24h, 7d, 30d, all
    const country = searchParams.get("country")
    const tags = splitTokenInput(searchParams.get("tags"))
    const sortBy = searchParams.get("sortBy") || "trendingScore" // trendingScore, viewCount, likeCount, engagementRate, postedAt
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"
    const search = searchParams.get("search")
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "50", 10)))
    const offset = Math.max(0, Number.parseInt(searchParams.get("offset") || "0", 10))

    // Build where clause
    const where: Record<string, unknown> = { isHidden: false }
    const andClauses: Record<string, unknown>[] = []

    if (platform) {
      where.platform = platform
    }

    if (category) {
      where.category = category
    }

    if (contentStyle) {
      where.contentStyle = contentStyle
    }

    // Timeframe filter
    const startDate = resolveTimeframeStart(timeframe)
    if (startDate) {
      where.postedAt = { gte: startDate }
    }

    // Search in caption/creator/hashtags
    const normalizedSearch = normalizeToken(search || "")
    if (search?.trim()) {
      andClauses.push({
        OR: [
          { caption: { contains: search.trim(), mode: "insensitive" } },
          { creatorUsername: { contains: search.trim(), mode: "insensitive" } },
          { creatorDisplayName: { contains: search.trim(), mode: "insensitive" } },
          ...(normalizedSearch ? [{ hashtags: { has: normalizedSearch } }] : []),
        ],
      })
    }

    // Country filter from hashtag/caption lexical matches
    const countryTokens = mapCountryTokens(country)
    if (countryTokens.length > 0) {
      const filter = buildTokenFilter(countryTokens)
      if (filter) andClauses.push(filter)
    }

    // Generic tag filter
    if (tags.length > 0) {
      const filter = buildTokenFilter(tags)
      if (filter) andClauses.push(filter)
    }

    if (andClauses.length > 0) {
      where.AND = andClauses
    }

    // Determine sort field
    const orderBy: Record<string, string> = {}
    if (
      sortBy === "trendingScore" ||
      sortBy === "viewCount" ||
      sortBy === "likeCount" ||
      sortBy === "engagementRate" ||
      sortBy === "postedAt" ||
      sortBy === "commentCount"
    ) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.trendingScore = "desc"
    }

    // Get content
    const [content, total] = await Promise.all([
      db.trendingContent.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset
      }),
      db.trendingContent.count({ where })
    ])

    // Get unique categories and content styles for filters
    const allContent = await db.trendingContent.findMany({
      where: { isHidden: false },
      select: { category: true, contentStyle: true, hashtags: true, caption: true }
    })

    const categories = [...new Set(allContent.map(c => c.category).filter(Boolean))]
    const contentStyles = [...new Set(allContent.map(c => c.contentStyle).filter(Boolean))]
    const availableTags = [...new Set(allContent.flatMap((item) => item.hashtags.map(normalizeToken)).filter(Boolean))].slice(0, 100)
    const countries = inferCountriesFromContent(allContent)

    // Get featured content
    const featured = await db.trendingContent.findMany({
      where: { isFeatured: true, isHidden: false },
      orderBy: { trendingScore: "desc" },
      take: 5
    })

    return NextResponse.json({
      content,
      total,
      featured,
      filters: {
        categories,
        contentStyles,
        countries,
        tags: availableTags,
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + content.length < total
      }
    })
  } catch (error) {
    console.error("Failed to fetch trending content:", error)
    return NextResponse.json({ error: "Failed to fetch trending content" }, { status: 500 })
  }
}

// POST - Add new trending content (admin/system use)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const {
      platform,
      platformPostId,
      postUrl,
      creatorUsername,
      creatorDisplayName,
      creatorProfilePic,
      creatorFollowers,
      isVerified,
      contentType,
      thumbnailUrl,
      videoUrl,
      caption,
      hashtags,
      viewCount,
      likeCount,
      commentCount,
      shareCount,
      saveCount,
      category,
      contentStyle,
      difficulty,
      postedAt,
      isFeatured
    } = body

    // Calculate engagement rate
    const totalEngagement = (likeCount || 0) + (commentCount || 0) + (shareCount || 0)
    const engagementRate = viewCount > 0 ? (totalEngagement / viewCount) * 100 : 0

    // Calculate trending score (simple algorithm)
    // Higher weight for recent content, engagement rate, and absolute engagement
    const hoursOld = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60)
    const recencyBoost = Math.max(0, 100 - hoursOld) // Decays over ~4 days
    const engagementBoost = Math.log10((viewCount || 1)) * 10
    const trendingScore = (engagementRate * 10) + recencyBoost + engagementBoost

    const content = await db.trendingContent.upsert({
      where: { platformPostId },
      update: {
        viewCount,
        likeCount,
        commentCount,
        shareCount,
        saveCount,
        engagementRate,
        trendingScore,
        lastUpdatedAt: new Date()
      },
      create: {
        platform,
        platformPostId,
        postUrl,
        creatorUsername,
        creatorDisplayName,
        creatorProfilePic,
        creatorFollowers,
        isVerified,
        contentType: contentType || "VIDEO",
        thumbnailUrl,
        videoUrl,
        caption,
        hashtags: hashtags || [],
        viewCount: viewCount || 0,
        likeCount: likeCount || 0,
        commentCount: commentCount || 0,
        shareCount: shareCount || 0,
        saveCount: saveCount || 0,
        engagementRate,
        category,
        contentStyle,
        difficulty,
        postedAt: new Date(postedAt),
        trendingScore,
        isFeatured: isFeatured || false
      }
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error("Failed to add trending content:", error)
    return NextResponse.json({ error: "Failed to add trending content" }, { status: 500 })
  }
}














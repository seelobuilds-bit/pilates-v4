import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

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
    const sortBy = searchParams.get("sortBy") || "trendingScore" // trendingScore, viewCount, likeCount, engagementRate, postedAt
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build where clause
    const where: Record<string, unknown> = {
      isHidden: false
    }

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
    if (timeframe && timeframe !== "all") {
      const now = new Date()
      let startDate: Date

      switch (timeframe) {
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }

      where.postedAt = { gte: startDate }
    }

    // Search in caption or hashtags
    if (search) {
      where.OR = [
        { caption: { contains: search, mode: "insensitive" } },
        { creatorUsername: { contains: search, mode: "insensitive" } },
        { hashtags: { has: search.toLowerCase() } }
      ]
    }

    // Determine sort field
    const orderBy: Record<string, string> = {}
    if (sortBy === "trendingScore") {
      orderBy.trendingScore = sortOrder
    } else if (sortBy === "viewCount") {
      orderBy.viewCount = sortOrder
    } else if (sortBy === "likeCount") {
      orderBy.likeCount = sortOrder
    } else if (sortBy === "engagementRate") {
      orderBy.engagementRate = sortOrder
    } else if (sortBy === "postedAt") {
      orderBy.postedAt = sortOrder
    } else if (sortBy === "commentCount") {
      orderBy.commentCount = sortOrder
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
      select: { category: true, contentStyle: true }
    })

    const categories = [...new Set(allContent.map(c => c.category).filter(Boolean))]
    const contentStyles = [...new Set(allContent.map(c => c.contentStyle).filter(Boolean))]

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
        contentStyles
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

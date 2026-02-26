import { SocialContentType, SocialPlatform } from "@prisma/client"
import { db } from "@/lib/db"

type RawSourceItem = Record<string, unknown>

type NormalizedTrendingItem = {
  platform: SocialPlatform
  platformPostId: string
  postUrl: string
  creatorUsername: string
  creatorDisplayName: string | null
  creatorProfilePic: string | null
  creatorFollowers: number
  isVerified: boolean
  contentType: SocialContentType
  thumbnailUrl: string | null
  videoUrl: string | null
  caption: string | null
  hashtags: string[]
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  saveCount: number
  category: string | null
  contentStyle: string | null
  difficulty: string | null
  postedAt: Date
  isFeatured: boolean
}

function normalizePlatform(value: unknown): SocialPlatform | null {
  const raw = String(value || "").trim().toUpperCase()
  if (raw === "INSTAGRAM" || raw === "IG") return SocialPlatform.INSTAGRAM
  if (raw === "TIKTOK" || raw === "TT") return SocialPlatform.TIKTOK
  return null
}

function normalizeContentType(value: unknown): SocialContentType {
  const raw = String(value || "").trim().toUpperCase()
  if (raw === "IMAGE") return SocialContentType.IMAGE
  if (raw === "CAROUSEL") return SocialContentType.CAROUSEL
  if (raw === "REEL") return SocialContentType.REEL
  if (raw === "STORY") return SocialContentType.STORY
  return SocialContentType.VIDEO
}

function toInt(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "")
    const parsed = Number.parseFloat(cleaned)
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed))
  }
  return fallback
}

function toStringOrNull(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toPostedAt(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    if (Number.isFinite(parsed.getTime())) return parsed
  }
  return new Date()
}

function normalizeHashtags(value: unknown) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((tag) => String(tag).trim().toLowerCase().replace(/^#/, "")).filter(Boolean))]
  }
  if (typeof value === "string") {
    return [...new Set(value.split(/[,\s]+/).map((tag) => tag.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))]
  }
  return []
}

function calculateTrendingScore(item: {
  postedAt: Date
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
}) {
  const totalEngagement = item.likeCount + item.commentCount + item.shareCount
  const engagementRate = item.viewCount > 0 ? (totalEngagement / item.viewCount) * 100 : 0
  const hoursOld = Math.max(1, (Date.now() - item.postedAt.getTime()) / (1000 * 60 * 60))
  const recencyBoost = Math.max(0, 100 - hoursOld)
  const engagementBoost = Math.log10(Math.max(1, item.viewCount)) * 10
  return {
    engagementRate,
    trendingScore: engagementRate * 10 + recencyBoost + engagementBoost,
  }
}

function normalizeSourceItem(item: RawSourceItem): NormalizedTrendingItem | null {
  const platform = normalizePlatform(item.platform || item.source || item.network)
  const platformPostId = toStringOrNull(item.platformPostId || item.postId || item.id || item.video_id || item.media_id)
  const postUrl = toStringOrNull(item.postUrl || item.url || item.permalink || item.link)
  const creatorUsername = toStringOrNull(item.creatorUsername || item.username || item.author || item.authorUsername)
  if (!platform || !platformPostId || !postUrl || !creatorUsername) return null

  const postedAt = toPostedAt(item.postedAt || item.createdAt || item.publishedAt || item.create_time)
  return {
    platform,
    platformPostId,
    postUrl,
    creatorUsername,
    creatorDisplayName: toStringOrNull(item.creatorDisplayName || item.displayName || item.authorName),
    creatorProfilePic: toStringOrNull(item.creatorProfilePic || item.avatar || item.profilePicture),
    creatorFollowers: toInt(item.creatorFollowers || item.followers || item.follower_count),
    isVerified: Boolean(item.isVerified ?? item.verified),
    contentType: normalizeContentType(item.contentType || item.type),
    thumbnailUrl: toStringOrNull(item.thumbnailUrl || item.thumbnail || item.cover),
    videoUrl: toStringOrNull(item.videoUrl || item.video || item.video_play_url),
    caption: toStringOrNull(item.caption || item.description || item.text),
    hashtags: normalizeHashtags(item.hashtags || item.tags),
    viewCount: toInt(item.viewCount || item.views || item.play_count),
    likeCount: toInt(item.likeCount || item.likes || item.like_count),
    commentCount: toInt(item.commentCount || item.comments || item.comment_count),
    shareCount: toInt(item.shareCount || item.shares || item.share_count),
    saveCount: toInt(item.saveCount || item.saves || item.bookmark_count),
    category: toStringOrNull(item.category),
    contentStyle: toStringOrNull(item.contentStyle || item.style),
    difficulty: toStringOrNull(item.difficulty),
    postedAt,
    isFeatured: Boolean(item.isFeatured || item.featured),
  }
}

async function fetchFromCustomSource(limit: number) {
  const sourceUrl = process.env.SOCIAL_TRENDING_SOURCE_URL
  if (!sourceUrl) return []

  const headers: Record<string, string> = { Accept: "application/json" }
  if (process.env.SOCIAL_TRENDING_SOURCE_TOKEN) {
    headers.Authorization = `Bearer ${process.env.SOCIAL_TRENDING_SOURCE_TOKEN}`
  }

  const url = new URL(sourceUrl)
  if (!url.searchParams.has("limit")) {
    url.searchParams.set("limit", String(limit))
  }

  const response = await fetch(url.toString(), { headers })
  if (!response.ok) {
    throw new Error(`Custom trending source failed (${response.status})`)
  }
  const payload = (await response.json()) as unknown
  if (Array.isArray(payload)) return payload as RawSourceItem[]
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)) {
    return ((payload as { items: unknown[] }).items || []) as RawSourceItem[]
  }
  return []
}

async function fetchFromApify(limit: number) {
  const token = process.env.SOCIAL_TRENDING_APIFY_TOKEN
  const actorId = process.env.SOCIAL_TRENDING_APIFY_ACTOR_ID
  if (!token || !actorId) return []

  const runUrl = new URL(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`)
  runUrl.searchParams.set("token", token)
  runUrl.searchParams.set("format", "json")
  runUrl.searchParams.set("clean", "true")

  const body = {
    searchTerms: ["pilates", "reformer pilates", "pilates studio", "pilates workout"],
    maxItems: limit,
  }

  const response = await fetch(runUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Apify trending ingest failed (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  return Array.isArray(payload) ? (payload as RawSourceItem[]) : []
}

export async function ingestTrendingContent(options?: { limit?: number }) {
  const provider = (process.env.SOCIAL_TRENDING_PROVIDER || "NONE").trim().toUpperCase()
  const limit = Math.min(200, Math.max(20, options?.limit ?? 80))

  const rawItems = provider === "APIFY"
    ? await fetchFromApify(limit)
    : await fetchFromCustomSource(limit)

  const normalized = rawItems
    .map(normalizeSourceItem)
    .filter((item): item is NormalizedTrendingItem => Boolean(item))
    .slice(0, limit)

  let upserted = 0
  for (const item of normalized) {
    const metrics = calculateTrendingScore(item)
    await db.trendingContent.upsert({
      where: { platformPostId: item.platformPostId },
      update: {
        postUrl: item.postUrl,
        creatorUsername: item.creatorUsername,
        creatorDisplayName: item.creatorDisplayName,
        creatorProfilePic: item.creatorProfilePic,
        creatorFollowers: item.creatorFollowers,
        isVerified: item.isVerified,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        videoUrl: item.videoUrl,
        caption: item.caption,
        hashtags: item.hashtags,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
        shareCount: item.shareCount,
        saveCount: item.saveCount,
        engagementRate: metrics.engagementRate,
        category: item.category,
        contentStyle: item.contentStyle,
        difficulty: item.difficulty,
        postedAt: item.postedAt,
        trendingScore: metrics.trendingScore,
        isFeatured: item.isFeatured,
        isHidden: false,
        lastUpdatedAt: new Date(),
      },
      create: {
        platform: item.platform,
        platformPostId: item.platformPostId,
        postUrl: item.postUrl,
        creatorUsername: item.creatorUsername,
        creatorDisplayName: item.creatorDisplayName,
        creatorProfilePic: item.creatorProfilePic,
        creatorFollowers: item.creatorFollowers,
        isVerified: item.isVerified,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        videoUrl: item.videoUrl,
        caption: item.caption,
        hashtags: item.hashtags,
        viewCount: item.viewCount,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
        shareCount: item.shareCount,
        saveCount: item.saveCount,
        engagementRate: metrics.engagementRate,
        category: item.category,
        contentStyle: item.contentStyle,
        difficulty: item.difficulty,
        postedAt: item.postedAt,
        trendingScore: metrics.trendingScore,
        isFeatured: item.isFeatured,
      },
    })
    upserted += 1
  }

  return {
    provider,
    received: rawItems.length,
    normalized: normalized.length,
    upserted,
  }
}


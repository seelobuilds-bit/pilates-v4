import { ContentType, DifficultyLevel, Prisma, TrainingRequestStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const CONTENT_TYPES = new Set<ContentType>(["VIDEO", "PDF", "ARTICLE", "QUIZ"])
const DIFFICULTY_LEVELS = new Set<DifficultyLevel>(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])

function parseContentType(value: string | null): ContentType | null {
  if (!value) return null
  const normalized = value.toUpperCase() as ContentType
  return CONTENT_TYPES.has(normalized) ? normalized : null
}

function parseDifficulty(value: string | null): DifficultyLevel | null {
  if (!value) return null
  const normalized = value.toUpperCase() as DifficultyLevel
  return DIFFICULTY_LEVELS.has(normalized) ? normalized : null
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Class flows are only available for studio and teacher accounts" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const categoryId = String(request.nextUrl.searchParams.get("categoryId") || "").trim() || null
    const type = parseContentType(request.nextUrl.searchParams.get("type"))
    const difficulty = parseDifficulty(request.nextUrl.searchParams.get("difficulty"))
    const featuredOnly = request.nextUrl.searchParams.get("featuredOnly") === "1"
    const search = String(request.nextUrl.searchParams.get("search") || "").trim()

    const contentWhere: Prisma.ClassFlowContentWhereInput = {
      isPublished: true,
      ...(type ? { type } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(featuredOnly ? { isFeatured: true } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const categories = await db.classFlowCategory.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { id: categoryId } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        contents: {
          where: contentWhere,
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            difficulty: true,
            duration: true,
            videoUrl: true,
            pdfUrl: true,
            thumbnailUrl: true,
            isFeatured: true,
            tags: true,
          },
        },
      },
      orderBy: { order: "asc" },
    })

    const featured = await db.classFlowContent.findMany({
      where: {
        ...contentWhere,
        isFeatured: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        difficulty: true,
        duration: true,
        videoUrl: true,
        pdfUrl: true,
        thumbnailUrl: true,
        isFeatured: true,
        tags: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
    })

    const contentIds = Array.from(
      new Set(categories.flatMap((category) => category.contents.map((content) => content.id)))
    )

    const progressRows =
      decoded.role === "TEACHER" && decoded.teacherId && contentIds.length
        ? await db.classFlowProgress.findMany({
            where: {
              studioId: studio.id,
              teacherId: decoded.teacherId,
              contentId: { in: contentIds },
            },
            select: {
              contentId: true,
              isCompleted: true,
              progressPercent: true,
              lastViewedAt: true,
              completedAt: true,
              notes: true,
            },
          })
        : []

    const progressByContentId = new Map(progressRows.map((row) => [row.contentId, row]))

    const recentRequests = await db.trainingRequest.findMany({
      where: {
        studioId: studio.id,
        ...(decoded.role === "TEACHER" ? { requestedById: decoded.teacherId! } : {}),
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        preferredDate1: true,
        scheduledDate: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    })

    const pendingTrainingRequests = await db.trainingRequest.count({
      where: {
        studioId: studio.id,
        ...(decoded.role === "TEACHER" ? { requestedById: decoded.teacherId! } : {}),
        status: {
          in: [TrainingRequestStatus.PENDING, TrainingRequestStatus.APPROVED, TrainingRequestStatus.SCHEDULED],
        },
      },
    })

    const mapContent = (content: (typeof categories)[number]["contents"][number]) => {
      const progress = progressByContentId.get(content.id)
      return {
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        difficulty: content.difficulty,
        duration: content.duration,
        videoUrl: content.videoUrl,
        pdfUrl: content.pdfUrl,
        thumbnailUrl: content.thumbnailUrl,
        isFeatured: content.isFeatured,
        tags: content.tags || [],
        progress: progress
          ? {
              isCompleted: progress.isCompleted,
              progressPercent: progress.progressPercent,
              lastViewedAt: progress.lastViewedAt?.toISOString() || null,
              completedAt: progress.completedAt?.toISOString() || null,
              notes: progress.notes,
            }
          : null,
      }
    }

    const mappedCategories = categories
      .map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        contentCount: category.contents.length,
        contents: category.contents.map(mapContent),
      }))
      .filter((category) => category.contents.length > 0)

    const mappedFeatured = featured.map((content) => mapContent(content))
    const totalContent = mappedCategories.reduce((sum, category) => sum + category.contentCount, 0)
    const featuredContent = mappedCategories.reduce(
      (sum, category) => sum + category.contents.filter((content) => content.isFeatured).length,
      0
    )
    const completedContent = progressRows.filter((progress) => progress.isCompleted).length

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      filters: {
        categoryId,
        type,
        difficulty,
        featuredOnly,
        search,
      },
      stats: {
        categories: mappedCategories.length,
        totalContent,
        featuredContent,
        completedContent,
        pendingTrainingRequests,
      },
      categories: mappedCategories,
      featured: mappedFeatured,
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        title: request.title,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        preferredDate1: request.preferredDate1?.toISOString() || null,
        scheduledDate: request.scheduledDate?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error("Mobile class flows error:", error)
    return NextResponse.json({ error: "Failed to load class flows" }, { status: 500 })
  }
}

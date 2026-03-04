import { NextRequest, NextResponse } from "next/server"
import { summarizeClassFlowDetail } from "@/lib/class-flows/analytics"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

function articlePreview(value: string | null, maxLength = 420) {
  if (!value) return null
  const normalized = value.replace(/\s+/g, " ").trim()
  if (!normalized) return null
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}...`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      if (auth.reason === "invalid_token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const decoded = auth.decoded

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Class flows are only available for studio and teacher accounts" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const studio = auth.studio

    const { contentId } = await params
    const content = await db.classFlowContent.findFirst({
      where: {
        id: contentId,
        isPublished: true,
        category: {
          isActive: true,
        },
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
        articleContent: true,
        isFeatured: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const [categoryContentCount, relatedRows, recentRequests] = await Promise.all([
      db.classFlowContent.count({
        where: {
          categoryId: content.categoryId,
          isPublished: true,
        },
      }),
      db.classFlowContent.findMany({
        where: {
          categoryId: content.categoryId,
          isPublished: true,
          id: { not: content.id },
        },
        select: {
          id: true,
          title: true,
          type: true,
          difficulty: true,
          duration: true,
          thumbnailUrl: true,
          isFeatured: true,
        },
        orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
        take: 8,
      }),
      db.trainingRequest.findMany({
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
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      }),
    ])

    const progressRows =
      decoded.role === "TEACHER" && decoded.teacherId
        ? await db.classFlowProgress.findMany({
            where: {
              studioId: studio.id,
              teacherId: decoded.teacherId,
              contentId: {
                in: [content.id, ...relatedRows.map((item) => item.id)],
              },
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
    const currentProgress = progressByContentId.get(content.id)

    const detailStats = summarizeClassFlowDetail(recentRequests, relatedRows.length, categoryContentCount)

    return NextResponse.json({
      role: decoded.role,
      studio: toMobileStudioSummary(studio),
      content: {
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        difficulty: content.difficulty,
        duration: content.duration,
        videoUrl: content.videoUrl,
        pdfUrl: content.pdfUrl,
        thumbnailUrl: content.thumbnailUrl,
        articlePreview: articlePreview(content.articleContent),
        isFeatured: content.isFeatured,
        tags: content.tags || [],
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
        category: content.category,
        resourceAvailability: {
          video: Boolean(content.videoUrl),
          pdf: Boolean(content.pdfUrl),
          article: Boolean(content.articleContent?.trim()),
        },
      },
      progress: currentProgress
        ? {
            isCompleted: currentProgress.isCompleted,
            progressPercent: currentProgress.progressPercent,
            lastViewedAt: currentProgress.lastViewedAt?.toISOString() || null,
            completedAt: currentProgress.completedAt?.toISOString() || null,
            notes: currentProgress.notes,
          }
        : null,
      relatedContent: relatedRows.map((row) => {
        const progress = progressByContentId.get(row.id)
        return {
          id: row.id,
          title: row.title,
          type: row.type,
          difficulty: row.difficulty,
          duration: row.duration,
          thumbnailUrl: row.thumbnailUrl,
          isFeatured: row.isFeatured,
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
      }),
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        title: request.title,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        preferredDate1: request.preferredDate1?.toISOString() || null,
        scheduledDate: request.scheduledDate?.toISOString() || null,
      })),
      stats: {
        categoryContentCount: detailStats.categoryContentCount,
        relatedContentCount: detailStats.relatedContentCount,
        requestCount: detailStats.requestCount,
      },
      permissions: {
        canUpdateProgress: decoded.role === "TEACHER",
      },
    })
  } catch (error) {
    console.error("Mobile class flow detail error:", error)
    return NextResponse.json({ error: "Failed to load class flow detail" }, { status: 500 })
  }
}

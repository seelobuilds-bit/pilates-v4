import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function clampProgress(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null
  }
  return Math.max(0, Math.min(100, Math.round(value)))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "TEACHER" || !decoded.teacherId) {
      return NextResponse.json({ error: "Only teachers can update class flow progress" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: { id: true, subdomain: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const { contentId } = await params
    const content = await db.classFlowContent.findFirst({
      where: {
        id: contentId,
        isPublished: true,
      },
      select: { id: true },
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const nextProgress = clampProgress(body.progressPercent)
    const isCompleted = typeof body.isCompleted === "boolean" ? body.isCompleted : undefined
    const notes =
      typeof body.notes === "string"
        ? body.notes
        : body.notes === null
          ? null
          : undefined

    const progress = await db.classFlowProgress.upsert({
      where: {
        contentId_teacherId: {
          contentId,
          teacherId: decoded.teacherId,
        },
      },
      update: {
        lastViewedAt: new Date(),
        ...(nextProgress !== null ? { progressPercent: nextProgress } : {}),
        ...(isCompleted !== undefined
          ? {
              isCompleted,
              completedAt: isCompleted ? new Date() : null,
            }
          : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      create: {
        contentId,
        teacherId: decoded.teacherId,
        studioId: decoded.studioId,
        progressPercent: nextProgress ?? (isCompleted ? 100 : 0),
        isCompleted: Boolean(isCompleted),
        completedAt: isCompleted ? new Date() : null,
        notes: notes ?? null,
      },
      select: {
        isCompleted: true,
        progressPercent: true,
        lastViewedAt: true,
        completedAt: true,
        notes: true,
      },
    })

    return NextResponse.json({
      success: true,
      progress: {
        isCompleted: progress.isCompleted,
        progressPercent: progress.progressPercent,
        lastViewedAt: progress.lastViewedAt?.toISOString() || null,
        completedAt: progress.completedAt?.toISOString() || null,
        notes: progress.notes,
      },
    })
  } catch (error) {
    console.error("Mobile class flow progress error:", error)
    return NextResponse.json({ error: "Failed to update class flow progress" }, { status: 500 })
  }
}

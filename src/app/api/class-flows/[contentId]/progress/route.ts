import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// POST - Update progress on content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getSession()
  const { contentId } = await params

  if (!session?.user?.teacherId || !session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { progressPercent, isCompleted, notes } = body

    const progress = await db.classFlowProgress.upsert({
      where: {
        contentId_teacherId: {
          contentId,
          teacherId: session.user.teacherId
        }
      },
      update: {
        lastViewedAt: new Date(),
        ...(progressPercent !== undefined && { progressPercent }),
        ...(isCompleted !== undefined && { 
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }),
        ...(notes !== undefined && { notes })
      },
      create: {
        contentId,
        teacherId: session.user.teacherId,
        studioId: session.user.studioId,
        progressPercent: progressPercent || 0,
        isCompleted: isCompleted || false,
        notes: notes || null
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Failed to update progress:", error)
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
  }
}






















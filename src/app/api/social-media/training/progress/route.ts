import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// POST - Update training progress
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Teachers only" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { moduleId, watchedPercent, isCompleted, notes } = body

    const progress = await db.socialTrainingProgress.upsert({
      where: {
        moduleId_teacherId: {
          moduleId,
          teacherId: session.user.teacherId
        }
      },
      update: {
        lastWatchedAt: new Date(),
        ...(watchedPercent !== undefined && { watchedPercent }),
        ...(isCompleted !== undefined && { 
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }),
        ...(notes !== undefined && { notes })
      },
      create: {
        moduleId,
        teacherId: session.user.teacherId,
        watchedPercent: watchedPercent || 0,
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















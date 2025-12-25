import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all training categories and modules
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch categories with modules
    const categories = await db.socialTrainingCategory.findMany({
      include: {
        modules: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: {
            homework: {
              where: { isActive: true }
            },
            _count: {
              select: { registrations: true }
            }
          }
        }
      },
      orderBy: { order: "asc" }
    })

    // Get teacher progress if applicable
    let progress: Record<string, { isCompleted: boolean; watchedPercent: number }> = {}
    let homeworkProgress: Record<string, { isCompleted: boolean; progress: Record<string, number> }> = {}
    
    if (session.user.teacherId) {
      const teacherProgress = await db.socialTrainingProgress.findMany({
        where: { teacherId: session.user.teacherId }
      })
      
      progress = teacherProgress.reduce((acc, p) => {
        acc[p.moduleId] = {
          isCompleted: p.isCompleted,
          watchedPercent: p.watchedPercent
        }
        return acc
      }, {} as Record<string, { isCompleted: boolean; watchedPercent: number }>)

      // Get homework submissions
      const submissions = await db.socialHomeworkSubmission.findMany({
        where: { teacherId: session.user.teacherId }
      })

      homeworkProgress = submissions.reduce((acc, s) => {
        acc[s.homeworkId] = {
          isCompleted: s.isCompleted,
          progress: JSON.parse(s.progress || "{}")
        }
        return acc
      }, {} as Record<string, { isCompleted: boolean; progress: Record<string, number> }>)
    }

    // Get weekly content ideas
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const contentIdeas = await db.socialContentIdea.findMany({
      where: {
        isActive: true,
        weekOf: { gte: weekStart }
      },
      orderBy: { weekOf: "desc" },
      take: 10
    })

    // Get upcoming live events
    const upcomingEvents = await db.socialTrainingModule.findMany({
      where: {
        OR: [
          { isLive: true, liveDate: { gte: new Date() } },
          { isInPerson: true, liveDate: { gte: new Date() } }
        ],
        isPublished: true
      },
      include: {
        category: true,
        _count: { select: { registrations: true } }
      },
      orderBy: { liveDate: "asc" },
      take: 5
    })

    return NextResponse.json({
      categories,
      progress,
      homeworkProgress,
      contentIdeas,
      upcomingEvents
    })
  } catch (error) {
    console.error("Failed to fetch training:", error)
    return NextResponse.json({ error: "Failed to fetch training" }, { status: 500 })
  }
}




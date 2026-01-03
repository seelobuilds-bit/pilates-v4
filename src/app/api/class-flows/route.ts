import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all class flow categories with content
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const categoryId = searchParams.get("categoryId")
  const type = searchParams.get("type")
  const difficulty = searchParams.get("difficulty")

  try {
    // Fetch categories with content
    const categories = await db.classFlowCategory.findMany({
      where: { isActive: true },
      include: {
        contents: {
          where: {
            isPublished: true,
            ...(type && { type: type as "VIDEO" | "PDF" | "ARTICLE" | "QUIZ" }),
            ...(difficulty && { difficulty: difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" })
          },
          orderBy: { order: "asc" }
        },
        _count: {
          select: { contents: true }
        }
      },
      orderBy: { order: "asc" }
    })

    // If user is a teacher, include their progress
    let progress: Record<string, { isCompleted: boolean; progressPercent: number }> = {}
    
    if (session.user.teacherId) {
      const teacherProgress = await db.classFlowProgress.findMany({
        where: { teacherId: session.user.teacherId }
      })
      
      progress = teacherProgress.reduce((acc, p) => {
        acc[p.contentId] = {
          isCompleted: p.isCompleted,
          progressPercent: p.progressPercent
        }
        return acc
      }, {} as Record<string, { isCompleted: boolean; progressPercent: number }>)
    }

    // Get featured content
    const featured = await db.classFlowContent.findMany({
      where: {
        isPublished: true,
        isFeatured: true
      },
      include: {
        category: true
      },
      take: 6
    })

    return NextResponse.json({
      categories,
      featured,
      progress
    })
  } catch (error) {
    console.error("Failed to fetch class flows:", error)
    return NextResponse.json({ error: "Failed to fetch class flows" }, { status: 500 })
  }
}




















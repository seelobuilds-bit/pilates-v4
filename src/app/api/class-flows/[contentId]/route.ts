import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch single content item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getSession()
  const { contentId } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const content = await db.classFlowContent.findUnique({
      where: { id: contentId },
      include: {
        category: true
      }
    })

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    // Get teacher's progress if applicable
    let progress = null
    if (session.user.teacherId) {
      progress = await db.classFlowProgress.findUnique({
        where: {
          contentId_teacherId: {
            contentId,
            teacherId: session.user.teacherId
          }
        }
      })
    }

    // Get related content from same category
    const related = await db.classFlowContent.findMany({
      where: {
        categoryId: content.categoryId,
        id: { not: contentId },
        isPublished: true
      },
      take: 4
    })

    return NextResponse.json({
      content,
      progress,
      related
    })
  } catch (error) {
    console.error("Failed to fetch content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}











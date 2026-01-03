import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// POST - Create a new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { courseId, moduleId } = await params
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify course ownership
    const course = await db.vaultCourse.findFirst({
      where: {
        id: courseId,
        studioId: session.user.studioId
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      contentType,
      videoUrl,
      videoDuration,
      textContent,
      pdfUrl,
      quizContent,
      isPreview
    } = body

    // Get the highest order
    const lastLesson = await db.vaultLesson.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" }
    })

    const lesson = await db.vaultLesson.create({
      data: {
        title,
        description,
        contentType: contentType || "video",
        videoUrl,
        videoDuration,
        textContent,
        pdfUrl,
        quizContent,
        isPreview: isPreview || false,
        order: (lastLesson?.order ?? -1) + 1,
        moduleId
      },
      include: {
        resources: true
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error("Failed to create lesson:", error)
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 })
  }
}

// PATCH - Update lesson or reorder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // If lessonOrders is provided, reorder lessons
    if (body.lessonOrders) {
      await db.$transaction(
        body.lessonOrders.map((l: { id: string; order: number }) =>
          db.vaultLesson.update({
            where: { id: l.id },
            data: { order: l.order }
          })
        )
      )
      return NextResponse.json({ success: true })
    }

    // Otherwise update a single lesson
    const {
      lessonId,
      title,
      description,
      contentType,
      videoUrl,
      videoDuration,
      textContent,
      pdfUrl,
      quizContent,
      isPreview,
      isPublished
    } = body

    const lesson = await db.vaultLesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(contentType !== undefined && { contentType }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(videoDuration !== undefined && { videoDuration }),
        ...(textContent !== undefined && { textContent }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(quizContent !== undefined && { quizContent }),
        ...(isPreview !== undefined && { isPreview }),
        ...(isPublished !== undefined && { isPublished })
      },
      include: {
        resources: true
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error("Failed to update lesson:", error)
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 })
  }
}

// DELETE - Delete a lesson
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get("lessonId")

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!lessonId) {
    return NextResponse.json({ error: "Lesson ID required" }, { status: 400 })
  }

  try {
    await db.vaultLesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete lesson:", error)
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 })
  }
}













import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// POST - Create new content
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      type,
      difficulty,
      categoryId,
      videoUrl,
      thumbnailUrl,
      pdfUrl,
      articleContent,
      duration,
      tags,
      isPublished,
      isFeatured
    } = body

    const content = await db.classFlowContent.create({
      data: {
        title,
        description,
        type,
        difficulty: difficulty || "BEGINNER",
        categoryId,
        videoUrl,
        thumbnailUrl,
        pdfUrl,
        articleContent,
        duration,
        tags: tags || [],
        isPublished: isPublished !== false,
        isFeatured: isFeatured || false
      }
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error("Failed to create content:", error)
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
  }
}

// PATCH - Update content
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 })
    }

    const content = await db.classFlowContent.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error("Failed to update content:", error)
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 })
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Content ID required" }, { status: 400 })
  }

  try {
    await db.classFlowContent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete content:", error)
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 })
  }
}






















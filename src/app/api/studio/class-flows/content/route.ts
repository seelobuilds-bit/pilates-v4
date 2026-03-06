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

    const category = await db.classFlowCategory.findFirst({
      where: {
        id: categoryId,
        studioId: session.user.studioId,
      },
      select: { id: true },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

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

    const existing = await db.classFlowContent.findFirst({
      where: {
        id,
        category: {
          studioId: session.user.studioId,
        },
      },
      select: { id: true, categoryId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    if (typeof updateData.categoryId === "string" && updateData.categoryId !== existing.categoryId) {
      const targetCategory = await db.classFlowCategory.findFirst({
        where: {
          id: updateData.categoryId,
          studioId: session.user.studioId,
        },
        select: { id: true },
      })

      if (!targetCategory) {
        return NextResponse.json({ error: "Target category not found" }, { status: 404 })
      }
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
    const existing = await db.classFlowContent.findFirst({
      where: {
        id,
        category: {
          studioId: session.user.studioId,
        },
      },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 })
    }

    await db.classFlowContent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete content:", error)
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 })
  }
}























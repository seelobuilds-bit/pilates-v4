import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch modules for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  try {
    const modules = await db.vaultModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            resources: true
          }
        }
      }
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error("Failed to fetch modules:", error)
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 })
  }
}

// POST - Create a new module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
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
    const { title, description, dripDelay } = body

    // Get the highest order
    const lastModule = await db.vaultModule.findFirst({
      where: { courseId },
      orderBy: { order: "desc" }
    })

    const module = await db.vaultModule.create({
      data: {
        title,
        description,
        dripDelay,
        order: (lastModule?.order ?? -1) + 1,
        courseId
      },
      include: {
        lessons: true
      }
    })

    return NextResponse.json(module)
  } catch (error) {
    console.error("Failed to create module:", error)
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 })
  }
}

// PATCH - Reorder modules
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { moduleOrders } = body // Array of { id, order }

    // Update all module orders in a transaction
    await db.$transaction(
      moduleOrders.map((m: { id: string; order: number }) =>
        db.vaultModule.update({
          where: { id: m.id },
          data: { order: m.order }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reorder modules:", error)
    return NextResponse.json({ error: "Failed to reorder modules" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all categories and content for admin management
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const categories = await db.classFlowCategory.findMany({
      include: {
        contents: {
          orderBy: { order: "asc" }
        },
        _count: {
          select: { contents: true }
        }
      },
      orderBy: { order: "asc" }
    })

    // Get teacher progress stats for this studio
    const progressStats = await db.classFlowProgress.groupBy({
      by: ["contentId"],
      where: { studioId: session.user.studioId },
      _count: { id: true },
      _sum: { progressPercent: true }
    })

    const completedCount = await db.classFlowProgress.count({
      where: {
        studioId: session.user.studioId,
        isCompleted: true
      }
    })

    // Get training requests
    const trainingRequests = await db.trainingRequest.findMany({
      where: { studioId: session.user.studioId },
      include: {
        requestedBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    return NextResponse.json({
      categories,
      stats: {
        totalViews: progressStats.reduce((sum, p) => sum + p._count.id, 0),
        completedCount,
        pendingTrainingRequests: trainingRequests.filter(r => r.status === "PENDING").length
      },
      trainingRequests
    })
  } catch (error) {
    console.error("Failed to fetch admin data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, icon, color } = body

    const category = await db.classFlowCategory.create({
      data: {
        name,
        description,
        icon,
        color
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Failed to create category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

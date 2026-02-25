import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET() {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
    }

    const [categories, progressStats, completedCount, trainingRequests, studioTeachers] = await Promise.all([
      db.classFlowCategory.findMany({
        include: {
          contents: {
            orderBy: { order: "asc" }
          },
          _count: {
            select: { contents: true }
          }
        },
        orderBy: { order: "asc" }
      }),
      db.classFlowProgress.groupBy({
        by: ["contentId"],
        where: { studioId },
        _count: { id: true },
      }),
      db.classFlowProgress.count({
        where: {
          studioId,
          isCompleted: true
        }
      }),
      db.trainingRequest.findMany({
        where: { studioId },
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
      }),
      db.teacher.findMany({
        where: {
          studioId,
          isActive: true
        },
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          user: {
            firstName: "asc"
          }
        }
      })
    ])

    return NextResponse.json({
      categories,
      stats: {
        totalViews: progressStats.reduce((sum, progress) => sum + progress._count.id, 0),
        completedCount,
        pendingTrainingRequests: trainingRequests.filter((request) => request.status === "PENDING").length
      },
      trainingRequests,
      teachers: studioTeachers.map((teacher) => ({
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`
      }))
    })
  } catch (error) {
    console.error("Failed to fetch demo class-flow admin data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

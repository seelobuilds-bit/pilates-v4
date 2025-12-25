import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all training content for admin
export async function GET() {
  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized - HQ Admin only" }, { status: 401 })
  }

  try {
    const categories = await db.socialTrainingCategory.findMany({
      include: {
        modules: {
          include: {
            homework: true,
            _count: {
              select: {
                progress: true,
                registrations: true
              }
            }
          },
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    })

    const contentIdeas = await db.socialContentIdea.findMany({
      orderBy: { weekOf: "desc" },
      take: 20
    })

    return NextResponse.json({ categories, contentIdeas })
  } catch (error) {
    console.error("Failed to fetch training data:", error)
    return NextResponse.json({ error: "Failed to fetch training data" }, { status: 500 })
  }
}

// POST - Create category or module
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized - HQ Admin only" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === "category") {
      const category = await db.socialTrainingCategory.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          order: data.order || 0
        }
      })
      return NextResponse.json(category)
    }

    if (type === "module") {
      const module = await db.socialTrainingModule.create({
        data: {
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          duration: data.duration,
          isLive: data.isLive || false,
          liveDate: data.liveDate ? new Date(data.liveDate) : null,
          liveUrl: data.liveUrl,
          isInPerson: data.isInPerson || false,
          eventLocation: data.eventLocation,
          eventAddress: data.eventAddress,
          maxAttendees: data.maxAttendees,
          resources: data.resources ? JSON.stringify(data.resources) : null,
          order: data.order || 0
        }
      })
      return NextResponse.json(module)
    }

    if (type === "homework") {
      const homework = await db.socialTrainingHomework.create({
        data: {
          moduleId: data.moduleId,
          title: data.title,
          description: data.description,
          requirements: JSON.stringify(data.requirements),
          points: data.points || 10,
          dueInDays: data.dueInDays
        }
      })
      return NextResponse.json(homework)
    }

    if (type === "content_idea") {
      const idea = await db.socialContentIdea.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          exampleScript: data.exampleScript,
          exampleVideoUrl: data.exampleVideoUrl,
          weekOf: new Date(data.weekOf)
        }
      })
      return NextResponse.json(idea)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Failed to create:", error)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}




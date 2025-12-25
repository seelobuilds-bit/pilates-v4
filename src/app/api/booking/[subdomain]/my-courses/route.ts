import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  try {
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${studio.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const client = await db.client.findUnique({
      where: { id: decoded.clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get client's active subscriptions to determine which courses they have access to
    const subscriptions = await db.vaultSubscriber.findMany({
      where: {
        clientId: client.id,
        status: "active"
      },
      include: {
        plan: true
      }
    })

    // Get audiences client has access to through subscriptions
    const audiences = subscriptions.map(s => s.plan.audience)

    // Get courses client is enrolled in directly
    const enrollments = await db.vaultEnrollment.findMany({
      where: {
        clientId: client.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            _count: { select: { modules: true } }
          }
        }
      }
    })

    // Get courses included in their subscriptions
    let subscriptionCourses: typeof enrollments[0]["course"][] = []
    if (audiences.length > 0) {
      subscriptionCourses = await db.vaultCourse.findMany({
        where: {
          studioId: client.studioId,
          isPublished: true,
          includeInSubscription: true,
          audience: { in: audiences }
        },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          _count: { select: { modules: true } }
        }
      })
    }

    // Combine and deduplicate courses
    const courseMap = new Map()
    
    for (const enrollment of enrollments) {
      courseMap.set(enrollment.course.id, {
        ...enrollment.course,
        progressPercent: enrollment.progressPercent
      })
    }

    for (const course of subscriptionCourses) {
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, {
          ...course,
          progressPercent: 0
        })
      }
    }

    const courses = Array.from(courseMap.values())

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

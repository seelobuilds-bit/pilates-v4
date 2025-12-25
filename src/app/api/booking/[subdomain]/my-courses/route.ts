import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const cookieStore = await cookies()
  const clientToken = cookieStore.get(`client_${subdomain}`)?.value

  if (!clientToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const client = await db.client.findFirst({
      where: {
        id: clientToken,
        studio: { subdomain }
      }
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

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all subscription plans for the studio
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  const audience = searchParams.get("audience")

  try {
    const studioId = session?.user?.studioId

    if (!studioId) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Build query
    const where: Record<string, unknown> = { studioId }
    if (audience) {
      where.audience = audience
    }

    // Get all subscription plans
    const plans = await db.vaultSubscriptionPlan.findMany({
      where,
      include: {
        communityChat: {
          select: { id: true, isEnabled: true }
        },
        _count: { select: { subscribers: true } }
      },
      orderBy: { createdAt: "asc" }
    })

    // Get courses by audience for each plan
    const plansWithCourses = await Promise.all(
      plans.map(async (plan) => {
        const courses = await db.vaultCourse.findMany({
          where: {
            studioId,
            audience: plan.audience,
            includeInSubscription: true,
            isPublished: true
          },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            enrollmentCount: true
          }
        })

        // Get active subscriber count
        const activeSubscribers = await db.vaultSubscriber.count({
          where: { planId: plan.id, status: "active" }
        })

        return {
          ...plan,
          includedCourses: courses,
          activeSubscribers
        }
      })
    )

    return NextResponse.json({ plans: plansWithCourses })
  } catch (error) {
    console.error("Failed to fetch subscription plans:", error)
    return NextResponse.json({ error: "Failed to fetch subscription plans" }, { status: 500 })
  }
}

// POST - Create or update a subscription plan for an audience
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      audience, // Required: STUDIO_OWNERS, TEACHERS, or CLIENTS
      name,
      description,
      monthlyPrice,
      quarterlyPrice,
      yearlyPrice,
      currency,
      includesAllCourses,
      includesClasses,
      classCreditsPerMonth,
      features
    } = body

    if (!audience || !["STUDIO_OWNERS", "TEACHERS", "CLIENTS"].includes(audience)) {
      return NextResponse.json({ error: "Invalid audience" }, { status: 400 })
    }

    // Check if plan exists for this audience
    const existingPlan = await db.vaultSubscriptionPlan.findUnique({
      where: {
        studioId_audience: {
          studioId: session.user.studioId,
          audience
        }
      }
    })

    let plan
    if (existingPlan) {
      // Update existing plan
      plan = await db.vaultSubscriptionPlan.update({
        where: { id: existingPlan.id },
        data: {
          name,
          description,
          monthlyPrice,
          quarterlyPrice,
          yearlyPrice,
          currency: currency || "USD",
          includesAllCourses: includesAllCourses ?? true,
          includesClasses: includesClasses ?? false,
          classCreditsPerMonth,
          features: features || []
        },
        include: {
          communityChat: true
        }
      })
    } else {
      // Create new plan
      plan = await db.vaultSubscriptionPlan.create({
        data: {
          name,
          description,
          audience,
          monthlyPrice,
          quarterlyPrice,
          yearlyPrice,
          currency: currency || "USD",
          includesAllCourses: includesAllCourses ?? true,
          includesClasses: includesClasses ?? false,
          classCreditsPerMonth,
          features: features || [],
          studioId: session.user.studioId
        },
        include: {
          communityChat: true
        }
      })

      // Create community chat for this subscription tier
      await db.vaultSubscriptionChat.create({
        data: {
          planId: plan.id,
          name: `${name} Community`,
          isEnabled: true
        }
      })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Failed to save subscription plan:", error)
    return NextResponse.json({ error: "Failed to save subscription plan" }, { status: 500 })
  }
}

// PATCH - Toggle course subscription inclusion or manage subscriptions
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { courseId, includeInSubscription, action, planId, interval } = body

    // Subscribe to a plan
    if (action === "subscribe" && planId) {
      const plan = await db.vaultSubscriptionPlan.findUnique({
        where: { id: planId },
        include: { communityChat: true }
      })

      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Subscription plan not available" }, { status: 400 })
      }

      // Calculate period dates
      const now = new Date()
      const periodEnd = new Date(now)
      if (interval === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else if (interval === "quarterly") {
        periodEnd.setMonth(periodEnd.getMonth() + 3)
      } else if (interval === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      }

      const subscriberData: Record<string, unknown> = {
        planId: plan.id,
        interval,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: "active"
      }

      if (session.user.teacherId) {
        subscriberData.teacherId = session.user.teacherId
      } else {
        subscriberData.userId = session.user.id
      }

      const subscriber = await db.vaultSubscriber.create({
        data: subscriberData as never,
        include: { plan: true }
      })

      // Add to community chat
      if (plan.communityChat) {
        await db.vaultSubscriptionChatMember.create({
          data: {
            chatId: plan.communityChat.id,
            subscriberId: subscriber.id,
            role: "member"
          }
        })
      }

      return NextResponse.json(subscriber)
    }

    // Toggle course subscription inclusion (studio admin only)
    if (courseId && session.user.studioId) {
      const course = await db.vaultCourse.update({
        where: { id: courseId },
        data: { includeInSubscription }
      })

      return NextResponse.json(course)
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}















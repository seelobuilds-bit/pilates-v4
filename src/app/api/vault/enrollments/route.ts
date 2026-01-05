import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch enrollments
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  
  const courseId = searchParams.get("courseId")
  const myEnrollments = searchParams.get("myEnrollments")

  try {
    // Build where clause
    const where: Record<string, unknown> = {}

    if (courseId) {
      where.courseId = courseId
    }

    // If fetching user's own enrollments
    if (myEnrollments === "true" && session?.user) {
      const orConditions = []
      if (session.user.teacherId) {
        orConditions.push({ teacherId: session.user.teacherId })
      }
      orConditions.push({ userId: session.user.id })
      where.OR = orConditions
    }

    // For studio admin, filter by studio's courses
    if (session?.user?.studioId && !myEnrollments) {
      where.course = { studioId: session.user.studioId }
    }

    const enrollments = await db.vaultEnrollment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            pricingType: true,
            price: true
          }
        },
        client: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        affiliateLink: {
          select: {
            code: true,
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        progress: {
          select: { lessonId: true, isCompleted: true }
        }
      },
      orderBy: { enrolledAt: "desc" }
    })

    // Get stats
    const stats = {
      total: enrollments.length,
      active: enrollments.filter(e => e.status === "ACTIVE").length,
      completed: enrollments.filter(e => e.status === "COMPLETED").length,
      totalRevenue: enrollments.reduce((sum, e) => sum + (e.paidAmount || 0), 0)
    }

    return NextResponse.json({ enrollments, stats })
  } catch (error) {
    console.error("Failed to fetch enrollments:", error)
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}

// POST - Create enrollment (enroll in course)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { courseId, affiliateCode, paymentInfo } = body

    // Get the course
    const course = await db.vaultCourse.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course.isPublished) {
      return NextResponse.json({ error: "Course is not available" }, { status: 400 })
    }

    // Check if already enrolled
    const enrollmentCheckConditions = []
    if (session.user.teacherId) {
      enrollmentCheckConditions.push({ teacherId: session.user.teacherId })
    }
    enrollmentCheckConditions.push({ userId: session.user.id })
    
    const existingEnrollment = await db.vaultEnrollment.findFirst({
      where: {
        courseId,
        OR: enrollmentCheckConditions
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    // Check affiliate link
    let affiliateLink = null
    if (affiliateCode) {
      affiliateLink = await db.vaultAffiliateLink.findFirst({
        where: { code: affiliateCode, courseId, isActive: true }
      })
    }

    // Calculate expiry date for time-limited access
    let expiresAt = null
    if (course.accessType === "TIME_LIMITED" && course.accessDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + course.accessDays)
    }

    // Determine which ID to use
    const enrollmentData: Record<string, unknown> = {
      courseId,
      status: "ACTIVE",
      expiresAt,
      affiliateLinkId: affiliateLink?.id
    }

    // In dashboard context, use teacherId or userId (clientId is for booking frontend)
    if (session.user.teacherId) {
      enrollmentData.teacherId = session.user.teacherId
    } else {
      enrollmentData.userId = session.user.id
    }

    // Add payment info if provided
    if (paymentInfo) {
      enrollmentData.paidAmount = paymentInfo.amount
      enrollmentData.paidAt = new Date()
      enrollmentData.paymentMethod = paymentInfo.method
      enrollmentData.transactionId = paymentInfo.transactionId
    }

    // Create enrollment
    const enrollment = await db.vaultEnrollment.create({
      data: enrollmentData as never,
      include: {
        course: { select: { id: true, title: true, slug: true } }
      }
    })

    // Note: Community chat is now subscription-tier only, not per-course enrollment

    // Record affiliate sale if applicable
    if (affiliateLink && paymentInfo?.amount > 0) {
      const commissionRate = affiliateLink.customCommission ?? course.affiliateCommission
      const commissionAmount = (paymentInfo.amount * commissionRate) / 100

      await db.vaultAffiliateSale.create({
        data: {
          affiliateLinkId: affiliateLink.id,
          saleAmount: paymentInfo.amount,
          commissionRate,
          commissionAmount,
          enrollmentId: enrollment.id
        }
      })

      // Update affiliate link stats
      await db.vaultAffiliateLink.update({
        where: { id: affiliateLink.id },
        data: {
          conversions: { increment: 1 },
          totalEarnings: { increment: commissionAmount }
        }
      })
    }

    // Update course enrollment count
    await db.vaultCourse.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } }
    })

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error("Failed to create enrollment:", error)
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 })
  }
}

// PATCH - Update enrollment (progress, status)
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { enrollmentId, lessonId, action } = body

    const enrollment = await db.vaultEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Mark lesson as complete
    if (action === "completeLesson" && lessonId) {
      await db.vaultProgress.upsert({
        where: {
          enrollmentId_lessonId: { enrollmentId, lessonId }
        },
        update: {
          isCompleted: true,
          completedAt: new Date()
        },
        create: {
          enrollmentId,
          lessonId,
          isCompleted: true,
          completedAt: new Date()
        }
      })

      // Calculate progress percentage
      const totalLessons = enrollment.course.modules.reduce(
        (sum, mod) => sum + mod.lessons.length, 0
      )
      const completedLessons = await db.vaultProgress.count({
        where: { enrollmentId, isCompleted: true }
      })

      const progressPercent = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

      // Update enrollment progress
      const isCompleted = progressPercent === 100

      await db.vaultEnrollment.update({
        where: { id: enrollmentId },
        data: {
          progressPercent,
          lessonsCompleted: completedLessons,
          lastAccessedAt: new Date(),
          ...(isCompleted && {
            status: "COMPLETED",
            completedAt: new Date()
          })
        }
      })

      return NextResponse.json({ 
        success: true, 
        progressPercent,
        lessonsCompleted: completedLessons,
        isCompleted
      })
    }

    // Update video progress
    if (action === "updateVideoProgress" && lessonId) {
      const { watchedSeconds, lastPosition } = body

      await db.vaultProgress.upsert({
        where: {
          enrollmentId_lessonId: { enrollmentId, lessonId }
        },
        update: {
          watchedSeconds,
          lastPosition
        },
        create: {
          enrollmentId,
          lessonId,
          watchedSeconds,
          lastPosition
        }
      })

      await db.vaultEnrollment.update({
        where: { id: enrollmentId },
        data: { lastAccessedAt: new Date() }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update enrollment:", error)
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 })
  }
}















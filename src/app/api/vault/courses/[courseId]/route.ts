import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch a single course with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const session = await getSession()

  try {
    const course = await db.vaultCourse.findUnique({
      where: { id: courseId },
      include: {
        studio: {
          select: { id: true, name: true, subdomain: true }
        },
        creator: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        },
        instructors: {
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                resources: true,
                _count: { select: { progress: true } }
              }
            }
          }
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            client: { select: { firstName: true, lastName: true } },
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            },
            user: { select: { firstName: true, lastName: true } }
          }
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
            reviews: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if user is enrolled
    let enrollment = null
    let hasSubscriptionAccess = false
    
    if (session?.user) {
      // Build enrollment query conditions
      const enrollmentConditions = []
      if (session.user.teacherId) {
        enrollmentConditions.push({ teacherId: session.user.teacherId })
      }
      enrollmentConditions.push({ userId: session.user.id })
      
      enrollment = await db.vaultEnrollment.findFirst({
        where: {
          courseId,
          OR: enrollmentConditions
        },
        include: {
          progress: true
        }
      })
      
      // If not directly enrolled, check for subscription access
      if (!enrollment && course.includeInSubscription) {
        const subscriptionConditions = []
        if (session.user.teacherId) {
          subscriptionConditions.push({ teacherId: session.user.teacherId })
        }
        subscriptionConditions.push({ userId: session.user.id })
        
        const activeSubscription = await db.vaultSubscriber.findFirst({
          where: {
            plan: { studioId: course.studioId },
            status: "active",
            OR: subscriptionConditions
          }
        })
        
        if (activeSubscription) {
          hasSubscriptionAccess = true
          
          // Auto-create enrollment for subscription member
          const enrollData: Record<string, unknown> = {
            courseId,
            status: "ACTIVE",
            paidAmount: 0
          }
          
          if (session.user.teacherId) {
            enrollData.teacherId = session.user.teacherId
          } else {
            enrollData.userId = session.user.id
          }
          
          enrollment = await db.vaultEnrollment.create({
            data: enrollData as never,
            include: { progress: true }
          })
          
          // Note: Community chat is now subscription-tier only, not per-course
          
          // Update course enrollment count
          await db.vaultCourse.update({
            where: { id: courseId },
            data: { enrollmentCount: { increment: 1 } }
          })
        }
      }
    }

    // Count total lessons
    const totalLessons = course.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0
    )

    return NextResponse.json({
      ...course,
      totalLessons,
      enrollment,
      isEnrolled: !!enrollment,
      hasSubscriptionAccess
    })
  } catch (error) {
    console.error("Failed to fetch course:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

// PATCH - Update a course
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
    // Verify ownership
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
    const {
      title,
      subtitle,
      description,
      thumbnailUrl,
      promoVideoUrl,
      audience,
      category,
      tags,
      difficulty,
      pricingType,
      price,
      currency,
      subscriptionInterval,
      subscriptionPrice,
      accessType,
      accessDays,
      dripIntervalDays,
      hasLiveEvents,
      hasCertificate,
      affiliateEnabled,
      affiliateCommission,
      includeInSubscription,
      isPublished,
      isFeatured
    } = body

    const updatedCourse = await db.vaultCourse.update({
      where: { id: courseId },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(promoVideoUrl !== undefined && { promoVideoUrl }),
        ...(audience !== undefined && { audience }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(difficulty !== undefined && { difficulty }),
        ...(pricingType !== undefined && { pricingType }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(subscriptionInterval !== undefined && { subscriptionInterval }),
        ...(subscriptionPrice !== undefined && { subscriptionPrice }),
        ...(accessType !== undefined && { accessType }),
        ...(accessDays !== undefined && { accessDays }),
        ...(dripIntervalDays !== undefined && { dripIntervalDays }),
        ...(hasLiveEvents !== undefined && { hasLiveEvents }),
        ...(hasCertificate !== undefined && { hasCertificate }),
        ...(affiliateEnabled !== undefined && { affiliateEnabled }),
        ...(affiliateCommission !== undefined && { affiliateCommission }),
        ...(includeInSubscription !== undefined && { includeInSubscription }),
        ...(isPublished !== undefined && { 
          isPublished,
          publishedAt: isPublished && !course.isPublished ? new Date() : course.publishedAt
        }),
        ...(isFeatured !== undefined && { isFeatured })
      },
      include: {
        studio: { select: { id: true, name: true } },
        creator: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        instructors: {
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      }
    })

    // Note: Community chat is now subscription-tier only, not per-course

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error("Failed to update course:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

// DELETE - Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify ownership
    const course = await db.vaultCourse.findFirst({
      where: {
        id: courseId,
        studioId: session.user.studioId
      },
      include: {
        _count: { select: { enrollments: true } }
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Don't allow deletion if there are enrollments
    if (course._count.enrollments > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with active enrollments" },
        { status: 400 }
      )
    }

    await db.vaultCourse.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete course:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}













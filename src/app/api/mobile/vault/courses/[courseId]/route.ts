import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function ratioPercentage(numerator: number, denominator: number, precision = 1) {
  if (denominator <= 0) return 0
  const factor = Math.pow(10, precision)
  return Math.round((numerator / denominator) * 100 * factor) / factor
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Vault is available for studio and teacher accounts only" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const { courseId } = await params
    const visibilityWhere: Prisma.VaultCourseWhereInput = {
      id: courseId,
      studioId: studio.id,
      ...(decoded.role === "TEACHER"
        ? {
            OR: [{ isPublished: true }, { creatorId: decoded.teacherId! }, { instructors: { some: { teacherId: decoded.teacherId! } } }],
          }
        : {}),
    }

    const course = await db.vaultCourse.findFirst({
      where: visibilityWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        description: true,
        thumbnailUrl: true,
        promoVideoUrl: true,
        audience: true,
        category: true,
        tags: true,
        difficulty: true,
        pricingType: true,
        price: true,
        currency: true,
        subscriptionInterval: true,
        subscriptionPrice: true,
        accessType: true,
        accessDays: true,
        dripIntervalDays: true,
        hasLiveEvents: true,
        hasCertificate: true,
        includeInSubscription: true,
        isPublished: true,
        isFeatured: true,
        enrollmentCount: true,
        reviewCount: true,
        averageRating: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        creator: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        instructors: {
          select: {
            id: true,
            role: true,
            teacher: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        modules: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            dripDelay: true,
            subscriptionAudience: true,
            isPublished: true,
            _count: {
              select: {
                lessons: true,
              },
            },
            lessons: {
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                title: true,
                order: true,
                contentType: true,
                isPreview: true,
                isPublished: true,
                videoDuration: true,
                _count: {
                  select: {
                    resources: true,
                  },
                },
              },
              take: 40,
            },
          },
        },
        enrollments: {
          orderBy: {
            enrolledAt: "desc",
          },
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            expiresAt: true,
            completedAt: true,
            progressPercent: true,
            lessonsCompleted: true,
            lastAccessedAt: true,
            paidAmount: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            teacher: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          take: 120,
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Vault course not found" }, { status: 404 })
    }

    const totalEnrollments = course.enrollments.length
    const activeEnrollments = course.enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length
    const completedEnrollments = course.enrollments.filter((enrollment) => enrollment.status === "COMPLETED").length
    const averageProgress =
      totalEnrollments > 0
        ? Math.round(
            (course.enrollments.reduce((sum, enrollment) => sum + (enrollment.progressPercent || 0), 0) / totalEnrollments) * 10
          ) / 10
        : 0

    const totalLessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0)
    const publishedModules = course.modules.filter((module) => module.isPublished).length
    const publishedLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.filter((lesson) => lesson.isPublished).length,
      0
    )

    return NextResponse.json({
      role: decoded.role,
      studio: {
        id: studio.id,
        name: studio.name,
        subdomain: studio.subdomain,
        primaryColor: studio.primaryColor,
        currency: studio.stripeCurrency,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        promoVideoUrl: course.promoVideoUrl,
        audience: course.audience,
        category: course.category,
        tags: course.tags || [],
        difficulty: course.difficulty,
        pricingType: course.pricingType,
        price: course.price,
        currency: course.currency,
        subscriptionInterval: course.subscriptionInterval,
        subscriptionPrice: course.subscriptionPrice,
        accessType: course.accessType,
        accessDays: course.accessDays,
        dripIntervalDays: course.dripIntervalDays,
        hasLiveEvents: course.hasLiveEvents,
        hasCertificate: course.hasCertificate,
        includeInSubscription: course.includeInSubscription,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        enrollmentCount: course.enrollmentCount,
        reviewCount: course.reviewCount,
        averageRating: course.averageRating,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        publishedAt: course.publishedAt?.toISOString() || null,
        creator: course.creator
          ? {
              id: course.creator.id,
              firstName: course.creator.user.firstName,
              lastName: course.creator.user.lastName,
              email: course.creator.user.email,
            }
          : null,
      },
      stats: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: ratioPercentage(completedEnrollments, totalEnrollments, 1),
        averageProgress,
        totalModules: course.modules.length,
        publishedModules,
        totalLessons,
        publishedLessons,
      },
      instructors: course.instructors.map((instructor) => ({
        id: instructor.id,
        role: instructor.role,
        teacher: {
          id: instructor.teacher.id,
          firstName: instructor.teacher.user.firstName,
          lastName: instructor.teacher.user.lastName,
          email: instructor.teacher.user.email,
        },
      })),
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        dripDelay: module.dripDelay,
        subscriptionAudience: module.subscriptionAudience,
        isPublished: module.isPublished,
        lessonCount: module._count.lessons,
        publishedLessons: module.lessons.filter((lesson) => lesson.isPublished).length,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          contentType: lesson.contentType,
          isPreview: lesson.isPreview,
          isPublished: lesson.isPublished,
          videoDuration: lesson.videoDuration,
          resourceCount: lesson._count.resources,
        })),
      })),
      recentEnrollments: course.enrollments.slice(0, 50).map((enrollment) => {
        const participant =
          enrollment.client
            ? {
                type: "CLIENT" as const,
                firstName: enrollment.client.firstName,
                lastName: enrollment.client.lastName,
                email: enrollment.client.email,
              }
            : enrollment.teacher?.user
              ? {
                  type: "TEACHER" as const,
                  firstName: enrollment.teacher.user.firstName,
                  lastName: enrollment.teacher.user.lastName,
                  email: enrollment.teacher.user.email,
                }
              : enrollment.user
                ? {
                    type: "OWNER" as const,
                    firstName: enrollment.user.firstName,
                    lastName: enrollment.user.lastName,
                    email: enrollment.user.email,
                  }
                : {
                    type: "UNKNOWN" as const,
                    firstName: "Unknown",
                    lastName: "User",
                    email: "",
                  }

        return {
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          expiresAt: enrollment.expiresAt?.toISOString() || null,
          completedAt: enrollment.completedAt?.toISOString() || null,
          progressPercent: enrollment.progressPercent,
          lessonsCompleted: enrollment.lessonsCompleted,
          lastAccessedAt: enrollment.lastAccessedAt?.toISOString() || null,
          paidAmount: enrollment.paidAmount,
          participant,
        }
      }),
    })
  } catch (error) {
    console.error("Mobile vault course detail error:", error)
    return NextResponse.json({ error: "Failed to load vault course detail" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Course publishing is available for studio owner accounts only" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        subdomain: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    const action = payload?.action
    if (action !== "publish" && action !== "unpublish") {
      return NextResponse.json({ error: "Invalid action. Use publish or unpublish." }, { status: 400 })
    }

    const { courseId } = await params
    const course = await db.vaultCourse.findFirst({
      where: {
        id: courseId,
        studioId: studio.id,
      },
      select: {
        id: true,
        isPublished: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Vault course not found" }, { status: 404 })
    }

    const nextPublished = action === "publish"
    if (course.isPublished === nextPublished) {
      return NextResponse.json({
        success: true,
        course: {
          id: course.id,
          isPublished: course.isPublished,
          publishedAt: course.publishedAt?.toISOString() || null,
          updatedAt: course.updatedAt.toISOString(),
        },
      })
    }

    const updatedCourse = await db.vaultCourse.update({
      where: { id: course.id },
      data: {
        isPublished: nextPublished,
        publishedAt: nextPublished && !course.isPublished ? new Date() : course.publishedAt,
      },
      select: {
        id: true,
        isPublished: true,
        publishedAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      course: {
        id: updatedCourse.id,
        isPublished: updatedCourse.isPublished,
        publishedAt: updatedCourse.publishedAt?.toISOString() || null,
        updatedAt: updatedCourse.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Mobile vault course publish action error:", error)
    return NextResponse.json({ error: "Failed to update vault course status" }, { status: 500 })
  }
}

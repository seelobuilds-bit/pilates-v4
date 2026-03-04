import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"
import { buildMobileVaultCourseDetailResponse } from "@/lib/vault/response"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      if (auth.reason === "invalid_token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const decoded = auth.decoded

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Vault is available for studio and teacher accounts only" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const studio = auth.studio

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

    return NextResponse.json(
      buildMobileVaultCourseDetailResponse({
        role: decoded.role,
        studio: toMobileStudioSummary(studio),
        course,
      })
    )
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
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      if (auth.reason === "invalid_token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const decoded = auth.decoded

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Course publishing is available for studio owner accounts only" }, { status: 403 })
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
        studioId: auth.studio.id,
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

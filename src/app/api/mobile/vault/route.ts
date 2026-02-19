import { Prisma, VaultAudience } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

const VALID_AUDIENCE_FILTERS = new Set(["all", "STUDIO_OWNERS", "TEACHERS", "CLIENTS", "ALL"])
const VALID_STATUS_FILTERS = new Set(["all", "published", "draft"])

function parseAudienceFilter(value: string | null) {
  const normalized = String(value || "all")
  if (VALID_AUDIENCE_FILTERS.has(normalized)) {
    return normalized as "all" | VaultAudience
  }
  return "all"
}

function parseStatusFilter(value: string | null) {
  const normalized = String(value || "published").toLowerCase()
  if (VALID_STATUS_FILTERS.has(normalized)) {
    return normalized as "all" | "published" | "draft"
  }
  return "published"
}

function buildSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    OR: [
      { title: { contains: normalized, mode: "insensitive" as const } },
      { description: { contains: normalized, mode: "insensitive" as const } },
      { category: { contains: normalized, mode: "insensitive" as const } },
    ],
  }
}

export async function GET(request: NextRequest) {
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

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const search = String(request.nextUrl.searchParams.get("search") || "").trim()
    const audience = parseAudienceFilter(request.nextUrl.searchParams.get("audience"))
    const status = parseStatusFilter(request.nextUrl.searchParams.get("status"))

    const visibilityWhere: Prisma.VaultCourseWhereInput = {
      studioId: studio.id,
      ...(decoded.role === "TEACHER"
        ? {
            OR: [{ isPublished: true }, { creatorId: decoded.teacherId! }, { instructors: { some: { teacherId: decoded.teacherId! } } }],
          }
        : {}),
    }

    const where: Prisma.VaultCourseWhereInput = {
      ...visibilityWhere,
      ...(audience === "all" ? {} : { audience }),
      ...(status === "published" ? { isPublished: true } : status === "draft" ? { isPublished: false } : {}),
      ...(buildSearchWhere(search) || {}),
    }

    const [courses, categories, totalCourses, publishedCourses, featuredCourses, enrollmentTotals] = await Promise.all([
      db.vaultCourse.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          subtitle: true,
          description: true,
          thumbnailUrl: true,
          audience: true,
          category: true,
          difficulty: true,
          pricingType: true,
          price: true,
          currency: true,
          isPublished: true,
          isFeatured: true,
          includeInSubscription: true,
          enrollmentCount: true,
          averageRating: true,
          createdAt: true,
          creator: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              modules: true,
              reviews: true,
            },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { isPublished: "desc" }, { createdAt: "desc" }],
        take: 250,
      }),
      db.vaultCourse.findMany({
        where: visibilityWhere,
        select: { category: true },
        distinct: ["category"],
      }),
      db.vaultCourse.count({ where }),
      db.vaultCourse.count({ where: { ...where, isPublished: true } }),
      db.vaultCourse.count({ where: { ...where, isFeatured: true } }),
      db.vaultCourse.aggregate({
        where,
        _sum: { enrollmentCount: true },
      }),
    ])

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      filters: {
        search,
        audience,
        status,
      },
      categories: categories
        .map((item) => item.category)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => a.localeCompare(b)),
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        audience: course.audience,
        category: course.category,
        difficulty: course.difficulty,
        pricingType: course.pricingType,
        price: course.price,
        currency: course.currency,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        includeInSubscription: course.includeInSubscription,
        enrollmentCount: course.enrollmentCount,
        averageRating: course.averageRating,
        moduleCount: course._count.modules,
        reviewCount: course._count.reviews,
        createdAt: course.createdAt.toISOString(),
        creatorName: course.creator?.user
          ? `${course.creator.user.firstName} ${course.creator.user.lastName}`.trim()
          : null,
      })),
      stats: {
        totalCourses,
        publishedCourses,
        featuredCourses,
        totalEnrollments: enrollmentTotals._sum.enrollmentCount || 0,
      },
    })
  } catch (error) {
    console.error("Mobile vault error:", error)
    return NextResponse.json({ error: "Failed to load vault" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch courses (with filters)
export async function GET(request: NextRequest) {
  const session = await getSession()
  const { searchParams } = new URL(request.url)
  
  const audience = searchParams.get("audience")
  const category = searchParams.get("category")
  const published = searchParams.get("published")
  const featured = searchParams.get("featured")
  const search = searchParams.get("search")
  const myCreated = searchParams.get("myCreated")
  const myEnrolled = searchParams.get("myEnrolled")

  try {
    // Build where clause
    const where: Record<string, unknown> = {}

    // For studio/teacher management, filter by their studio
    if (session?.user?.studioId && !myEnrolled) {
      where.studioId = session.user.studioId
    }

    // If teacher viewing their created courses
    if (myCreated === "true" && session?.user?.teacherId) {
      where.creatorId = session.user.teacherId
    }

    if (audience) {
      where.audience = audience
    }

    if (category) {
      where.category = category
    }

    if (published === "true") {
      where.isPublished = true
    } else if (published === "false") {
      where.isPublished = false
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const courses = await db.vaultCourse.findMany({
      where,
      include: {
        studio: {
          select: { id: true, name: true }
        },
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
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true
          }
        }
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" }
      ]
    })

    // Get categories for filters
    const categories = await db.vaultCourse.findMany({
      where: session?.user?.studioId ? { studioId: session.user.studioId } : {},
      select: { category: true },
      distinct: ["category"]
    })

    return NextResponse.json({
      courses,
      categories: categories.map(c => c.category).filter(Boolean)
    })
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

// POST - Create a new course
export async function POST(request: NextRequest) {
  const session = await getSession()

  // Must be studio owner or teacher
  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
      includeInSubscription
    } = body

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    
    // Make slug unique
    let slug = baseSlug
    let counter = 1
    while (await db.vaultCourse.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const course = await db.vaultCourse.create({
      data: {
        title,
        slug,
        subtitle,
        description,
        thumbnailUrl,
        promoVideoUrl,
        audience: audience || "CLIENTS",
        category,
        tags: tags || [],
        difficulty,
        pricingType: pricingType || "ONE_TIME",
        price: price || 0,
        currency: currency || "USD",
        subscriptionInterval,
        subscriptionPrice,
        accessType: accessType || "LIFETIME",
        accessDays,
        dripIntervalDays,
        hasLiveEvents: hasLiveEvents ?? false,
        hasCertificate: hasCertificate ?? false,
        affiliateEnabled: affiliateEnabled ?? true,
        affiliateCommission: affiliateCommission ?? 20,
        includeInSubscription: includeInSubscription ?? false,
        studioId: session.user.studioId,
        creatorId: session.user.teacherId || undefined
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
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true
          }
        }
      }
    })

    // Note: Community chat is now subscription-tier only, not per-course

    return NextResponse.json(course)
  } catch (error) {
    console.error("Failed to create course:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}

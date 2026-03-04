import { Prisma, VaultAudience } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"
import { buildMobileVaultCatalogResponse } from "@/lib/vault/response"

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
    const studioSummary = toMobileStudioSummary(studio)

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

    const [courses, categories] = await Promise.all([
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
    ])
    return NextResponse.json(
      buildMobileVaultCatalogResponse({
        role: decoded.role,
        studio: studioSummary,
        filters: {
          search,
          audience,
          status,
        },
        categories,
        courses,
      })
    )
  } catch (error) {
    console.error("Mobile vault error:", error)
    return NextResponse.json({ error: "Failed to load vault" }, { status: 500 })
  }
}

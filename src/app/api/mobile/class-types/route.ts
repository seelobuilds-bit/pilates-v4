import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

function buildSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    OR: [
      { name: { contains: normalized, mode: "insensitive" as const } },
      { description: { contains: normalized, mode: "insensitive" as const } },
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
      return NextResponse.json({ error: "Class types are only available for studio and teacher accounts" }, { status: 403 })
    }

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    const studio = auth.studio
    const studioSummary = toMobileStudioSummary(studio)

    const search = String(request.nextUrl.searchParams.get("search") || "")
    const status = String(request.nextUrl.searchParams.get("status") || "active").toLowerCase()
    const includeAll = status === "all"
    const searchWhere = buildSearchWhere(search)

    const classTypes = await db.classType.findMany({
      where: {
        studioId: studio.id,
        ...(includeAll ? {} : { isActive: true }),
        ...(searchWhere || {}),
        ...(decoded.role === "TEACHER"
          ? {
              classSessions: {
                some: {
                  teacherId: decoded.teacherId!,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        capacity: true,
        price: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: 250,
    })

    const classTypeIds = classTypes.map((item) => item.id)
    if (classTypeIds.length === 0) {
      return NextResponse.json({
        role: decoded.role,
        studio: studioSummary,
        status: includeAll ? "all" : "active",
        classTypes: [],
      })
    }

    const now = new Date()
    const [upcomingCounts, totalCounts] = await Promise.all([
      db.classSession.groupBy({
        by: ["classTypeId"],
        where: {
          studioId: studio.id,
          classTypeId: { in: classTypeIds },
          startTime: { gte: now },
          ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
        },
        _count: {
          _all: true,
        },
      }),
      db.classSession.groupBy({
        by: ["classTypeId"],
        where: {
          studioId: studio.id,
          classTypeId: { in: classTypeIds },
          ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
        },
        _count: {
          _all: true,
        },
      }),
    ])

    const upcomingByClassTypeId = new Map(upcomingCounts.map((item) => [item.classTypeId, item._count._all]))
    const totalByClassTypeId = new Map(totalCounts.map((item) => [item.classTypeId, item._count._all]))

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      status: includeAll ? "all" : "active",
      classTypes: classTypes.map((classType) => ({
        id: classType.id,
        name: classType.name,
        description: classType.description,
        duration: classType.duration,
        capacity: classType.capacity,
        price: classType.price,
        isActive: classType.isActive,
        createdAt: classType.createdAt.toISOString(),
        upcomingSessions: upcomingByClassTypeId.get(classType.id) || 0,
        totalSessions: totalByClassTypeId.get(classType.id) || 0,
      })),
    })
  } catch (error) {
    console.error("Mobile class types error:", error)
    return NextResponse.json({ error: "Failed to load class types" }, { status: 500 })
  }
}

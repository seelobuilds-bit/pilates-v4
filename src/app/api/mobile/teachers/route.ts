import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function buildSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    OR: [
      { user: { firstName: { contains: normalized, mode: "insensitive" as const } } },
      { user: { lastName: { contains: normalized, mode: "insensitive" as const } } },
      { user: { email: { contains: normalized, mode: "insensitive" as const } } },
      { specialties: { hasSome: [normalized] } },
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
      return NextResponse.json({ error: "Teachers are only available for studio and teacher accounts" }, { status: 403 })
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

    const search = String(request.nextUrl.searchParams.get("search") || "")
    const status = String(request.nextUrl.searchParams.get("status") || "active").toLowerCase()
    const includeAll = status === "all"
    const searchWhere = buildSearchWhere(search)
    const now = new Date()

    const teachers = await db.teacher.findMany({
      where: {
        studioId: studio.id,
        ...(decoded.role === "TEACHER" ? { id: decoded.teacherId || "__missing_teacher__" } : {}),
        ...(includeAll ? {} : { isActive: true }),
        ...(searchWhere || {}),
      },
      select: {
        id: true,
        bio: true,
        specialties: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payRate: {
          select: {
            type: true,
            rate: true,
            currency: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { user: { firstName: "asc" } }],
      take: 250,
    })

    const teacherIds = teachers.map((teacher) => teacher.id)
    if (teacherIds.length === 0) {
      return NextResponse.json({
        role: decoded.role,
        studio: studioSummary,
        status: includeAll ? "all" : "active",
        teachers: [],
      })
    }

    const [upcomingCounts, totalCounts] = await Promise.all([
      db.classSession.groupBy({
        by: ["teacherId"],
        where: {
          studioId: studio.id,
          teacherId: { in: teacherIds },
          startTime: { gte: now },
        },
        _count: {
          _all: true,
        },
      }),
      db.classSession.groupBy({
        by: ["teacherId"],
        where: {
          studioId: studio.id,
          teacherId: { in: teacherIds },
        },
        _count: {
          _all: true,
        },
      }),
    ])

    const upcomingByTeacherId = new Map(upcomingCounts.map((item) => [item.teacherId, item._count._all]))
    const totalByTeacherId = new Map(totalCounts.map((item) => [item.teacherId, item._count._all]))

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      status: includeAll ? "all" : "active",
      teachers: teachers.map((teacher) => ({
        id: teacher.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        bio: teacher.bio,
        specialties: teacher.specialties || [],
        isActive: teacher.isActive,
        createdAt: teacher.createdAt.toISOString(),
        upcomingSessions: upcomingByTeacherId.get(teacher.id) || 0,
        totalSessions: totalByTeacherId.get(teacher.id) || 0,
        payRate: teacher.payRate
          ? {
              type: teacher.payRate.type,
              rate: teacher.payRate.rate,
              currency: teacher.payRate.currency,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error("Mobile teachers error:", error)
    return NextResponse.json({ error: "Failed to load teachers" }, { status: 500 })
  }
}

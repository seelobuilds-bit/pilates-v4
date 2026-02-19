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
      { name: { contains: normalized, mode: "insensitive" as const } },
      { address: { contains: normalized, mode: "insensitive" as const } },
      { city: { contains: normalized, mode: "insensitive" as const } },
      { state: { contains: normalized, mode: "insensitive" as const } },
      { zipCode: { contains: normalized, mode: "insensitive" as const } },
      { phone: { contains: normalized, mode: "insensitive" as const } },
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
      return NextResponse.json({ error: "Locations are only available for studio and teacher accounts" }, { status: 403 })
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

    const search = String(request.nextUrl.searchParams.get("search") || "")
    const status = String(request.nextUrl.searchParams.get("status") || "active").toLowerCase()
    const includeAll = status === "all"
    const searchWhere = buildSearchWhere(search)

    const locations = await db.location.findMany({
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
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: 250,
    })

    const locationIds = locations.map((location) => location.id)
    if (locationIds.length === 0) {
      return NextResponse.json({
        role: decoded.role,
        studio: studioSummary,
        status: includeAll ? "all" : "active",
        locations: [],
      })
    }

    const now = new Date()
    const sessionWhere = {
      studioId: studio.id,
      locationId: { in: locationIds },
      ...(decoded.role === "TEACHER" ? { teacherId: decoded.teacherId! } : {}),
    }

    const [upcomingCounts, totalCounts] = await Promise.all([
      db.classSession.groupBy({
        by: ["locationId"],
        where: {
          ...sessionWhere,
          startTime: { gte: now },
        },
        _count: {
          _all: true,
        },
      }),
      db.classSession.groupBy({
        by: ["locationId"],
        where: sessionWhere,
        _count: {
          _all: true,
        },
      }),
    ])

    const upcomingByLocationId = new Map(upcomingCounts.map((item) => [item.locationId, item._count._all]))
    const totalByLocationId = new Map(totalCounts.map((item) => [item.locationId, item._count._all]))

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      status: includeAll ? "all" : "active",
      locations: locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        phone: location.phone,
        isActive: location.isActive,
        createdAt: location.createdAt.toISOString(),
        upcomingSessions: upcomingByLocationId.get(location.id) || 0,
        totalSessions: totalByLocationId.get(location.id) || 0,
      })),
    })
  } catch (error) {
    console.error("Mobile locations error:", error)
    return NextResponse.json({ error: "Failed to load locations" }, { status: 500 })
  }
}

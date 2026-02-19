import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

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

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    if (decoded.role === "OWNER") {
      const [activeClients, todayBookings, upcomingClasses] = await Promise.all([
        db.client.count({
          where: {
            studioId: studio.id,
            isActive: true,
          },
        }),
        db.booking.count({
          where: {
            studioId: studio.id,
            createdAt: { gte: startOfToday, lte: endOfToday },
          },
        }),
        db.classSession.count({
          where: {
            studioId: studio.id,
            startTime: { gte: now },
          },
        }),
      ])

      return NextResponse.json({
        role: "OWNER",
        studio: studioSummary,
        metrics: {
          activeClients,
          todayBookings,
          upcomingClasses,
        },
      })
    }

    if (decoded.role === "TEACHER") {
      const teacherId = decoded.teacherId
      if (!teacherId) {
        return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
      }

      const [todayClasses, upcomingClasses, activeStudents] = await Promise.all([
        db.classSession.count({
          where: {
            studioId: studio.id,
            teacherId,
            startTime: { gte: startOfToday, lte: endOfToday },
          },
        }),
        db.classSession.count({
          where: {
            studioId: studio.id,
            teacherId,
            startTime: { gte: now },
          },
        }),
        db.booking.count({
          where: {
            studioId: studio.id,
            classSession: { teacherId },
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
        }),
      ])

      return NextResponse.json({
        role: "TEACHER",
        studio: studioSummary,
        metrics: {
          todayClasses,
          upcomingClasses,
          activeStudents,
        },
      })
    }

    const clientId = decoded.clientId || decoded.sub
    const [upcomingBookings, completedBookings] = await Promise.all([
      db.booking.count({
        where: {
          studioId: studio.id,
          clientId,
          classSession: { startTime: { gte: now } },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      db.booking.count({
        where: {
          studioId: studio.id,
          clientId,
          status: "COMPLETED",
        },
      }),
    ])

    return NextResponse.json({
      role: "CLIENT",
      studio: studioSummary,
      metrics: {
        upcomingBookings,
        completedBookings,
      },
    })
  } catch (error) {
    console.error("Mobile bootstrap error:", error)
    return NextResponse.json({ error: "Failed to load mobile bootstrap data" }, { status: 500 })
  }
}

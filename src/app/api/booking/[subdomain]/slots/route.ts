import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const locationId = searchParams.get("locationId")
    const classTypeId = searchParams.get("classTypeId")
    const teacherId = searchParams.get("teacherId")
    const date = searchParams.get("date")

    const where: Record<string, unknown> = {
      studioId: studio.id,
      startTime: { gte: new Date() }
    }

    if (locationId) where.locationId = locationId
    if (classTypeId) where.classTypeId = classTypeId
    if (teacherId) where.teacherId = teacherId

    if (date) {
      const startOfDay = new Date(date + "T00:00:00")
      const endOfDay = new Date(date + "T23:59:59")
      where.startTime = { gte: startOfDay, lte: endOfDay }
    }

    const sessions = await db.classSession.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        classType: true,
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" },
      take: 20
    })

    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        teacher: s.teacher,
        classType: s.classType,
        location: s.location,
        spotsLeft: s.capacity - s._count.bookings
      }))
    )
  } catch (error) {
    console.error("Failed to fetch slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}

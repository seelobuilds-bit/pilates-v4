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
    const classSessionId = searchParams.get("classSessionId")

    const sessions = classSessionId
      ? await db.classSession.findMany({
          where: {
            id: classSessionId,
            studioId: studio.id,
            startTime: { gte: new Date() },
          },
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            classType: true,
            location: true,
            _count: {
              select: {
                bookings: {
                  where: { status: { in: ["CONFIRMED", "PENDING"] } },
                },
                waitlists: {
                  where: { status: "WAITING" },
                },
              },
            },
          },
          take: 1,
        })
      : await db.classSession.findMany({
          where: {
            studioId: studio.id,
            startTime: date
              ? {
                  gte: new Date(`${date}T00:00:00`),
                  lte: new Date(`${date}T23:59:59`),
                }
              : { gte: new Date() },
            ...(locationId ? { locationId } : {}),
            ...(classTypeId ? { classTypeId } : {}),
            ...(teacherId ? { teacherId } : {}),
          },
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            classType: true,
            location: true,
            _count: {
              select: {
                bookings: {
                  where: { status: { in: ["CONFIRMED", "PENDING"] } },
                },
                waitlists: {
                  where: { status: "WAITING" },
                },
              },
            },
          },
          orderBy: { startTime: "asc" },
          take: 20,
        })

    return NextResponse.json(
      sessions.map((s) => {
        const spotsLeft = s.capacity - s._count.bookings
        const isFull = spotsLeft <= 0
        return {
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          teacher: s.teacher,
          classType: s.classType,
          location: s.location,
          capacity: s.capacity,
          spotsLeft: Math.max(0, spotsLeft),
          isFull,
          waitlistCount: s._count.waitlists,
          canJoinWaitlist: isFull
        }
      })
    )
  } catch (error) {
    console.error("Failed to fetch slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
}

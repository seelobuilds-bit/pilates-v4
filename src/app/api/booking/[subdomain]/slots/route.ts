import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const locationId = searchParams.get("locationId")
  const classTypeId = searchParams.get("classTypeId")
  const teacherId = searchParams.get("teacherId")
  const date = searchParams.get("date")

  const studio = await db.studio.findUnique({
    where: { subdomain: params.subdomain }
  })

  if (!studio) {
    return NextResponse.json({ error: "Studio not found" }, { status: 404 })
  }

  // Build date filter
  let startTimeFilter: { gte: Date; lt?: Date } = { gte: new Date() }
  
  if (date) {
    const startOfDay = new Date(date + "T00:00:00")
    const endOfDay = new Date(date + "T23:59:59")
    startTimeFilter = {
      gte: startOfDay > new Date() ? startOfDay : new Date(),
      lt: endOfDay
    }
  }

  const sessions = await db.classSession.findMany({
    where: {
      studioId: studio.id,
      isActive: true,
      startTime: startTimeFilter,
      ...(locationId && { locationId }),
      ...(classTypeId && { classTypeId }),
      ...(teacherId && { teacherId })
    },
    include: {
      classType: true,
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } }
      },
      location: true,
      _count: { select: { bookings: { where: { status: "confirmed" } } } }
    },
    orderBy: { startTime: "asc" },
    take: 50
  })

  return NextResponse.json(
    sessions.map(s => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      classType: s.classType,
      teacher: { id: s.teacher.id, user: s.teacher.user },
      location: s.location,
      spotsLeft: s.capacity - s._count.bookings
    })).filter(s => s.spotsLeft > 0)
  )
}




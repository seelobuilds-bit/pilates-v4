import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const weekOffset = parseInt(searchParams.get("weekOffset") || "0")

  try {
    const teacherId = session.user.teacherId

    // Calculate week start and end
    const today = new Date()
    const currentDay = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay + (weekOffset * 7))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const classes = await db.classSession.findMany({
      where: {
        teacherId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      include: {
        classType: true,
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" }
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Failed to fetch teacher schedule:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}


























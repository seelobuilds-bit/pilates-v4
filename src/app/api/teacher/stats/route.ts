import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teacherId = session.user.teacherId

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    // Get classes for today
    const upcomingClasses = await db.classSession.findMany({
      where: {
        teacherId,
        startTime: {
          gte: new Date(),
          lt: tomorrow
        }
      },
      include: {
        classType: true,
        location: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "asc" }
    })

    // Get total classes this month
    const totalClasses = await db.classSession.count({
      where: {
        teacherId,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Get unique students this month
    const bookings = await db.booking.findMany({
      where: {
        classSession: {
          teacherId,
          startTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      },
      select: { clientId: true },
      distinct: ["clientId"]
    })

    return NextResponse.json({
      totalClasses,
      totalStudents: bookings.length,
      avgRating: 4.9, // Placeholder - would need a reviews system
      revenue: totalClasses * 175, // Placeholder calculation
      upcomingClasses,
      recentClasses: []
    })
  } catch (error) {
    console.error("Failed to fetch teacher stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}


























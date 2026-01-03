import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all blocked times for all teachers in the studio (for schedule view)
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const teacherId = searchParams.get("teacherId")

  try {
    const where: {
      teacher: { studioId: string }
      teacherId?: string
      OR?: Array<{
        startTime?: { gte?: Date; lte?: Date }
        endTime?: { gte?: Date; lte?: Date }
        AND?: Array<{ startTime?: { lte: Date }; endTime?: { gte: Date } }>
      }>
    } = {
      teacher: {
        studioId: session.user.studioId
      }
    }

    // Filter by specific teacher if provided
    if (teacherId) {
      where.teacherId = teacherId
    }

    // Filter by date range
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      where.OR = [
        { startTime: { gte: startDate, lte: endDate } },
        { endTime: { gte: startDate, lte: endDate } },
        { AND: [{ startTime: { lte: startDate } }, { endTime: { gte: endDate } }] }
      ]
    }

    const blockedTimes = await db.teacherBlockedTime.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { startTime: "asc" }
    })

    return NextResponse.json(blockedTimes)
  } catch (error) {
    console.error("Failed to fetch blocked times:", error)
    return NextResponse.json({ error: "Failed to fetch blocked times" }, { status: 500 })
  }
}
























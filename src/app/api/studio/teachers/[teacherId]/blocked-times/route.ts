import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch a specific teacher's blocked times (for studio admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { teacherId } = await params
  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  try {
    // Verify the teacher belongs to this studio
    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const where: {
      teacherId: string
      startTime?: { gte: Date }
      endTime?: { lte: Date }
    } = {
      teacherId
    }

    // Optionally filter by date range
    if (start) {
      where.startTime = { gte: new Date(start) }
    }
    if (end) {
      where.endTime = { lte: new Date(end) }
    }

    const blockedTimes = await db.teacherBlockedTime.findMany({
      where,
      orderBy: { startTime: "asc" }
    })

    return NextResponse.json(blockedTimes)
  } catch (error) {
    console.error("Failed to fetch blocked times:", error)
    return NextResponse.json({ error: "Failed to fetch blocked times" }, { status: 500 })
  }
}
























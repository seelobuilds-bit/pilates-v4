import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const teacherId = searchParams.get("teacherId")

  const where: {
    teacher: { studioId: string }
    teacherId?: string
    OR?: Array<{
      startTime?: { gte?: Date; lte?: Date }
      endTime?: { gte?: Date; lte?: Date }
      AND?: Array<{ startTime?: { lte: Date }; endTime?: { gte: Date } }>
    }>
  } = {
    teacher: { studioId }
  }

  if (teacherId) {
    where.teacherId = teacherId
  }

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
}

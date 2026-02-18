import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const { teacherId } = await params
  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, studioId }
  })

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  }

  const where: {
    teacherId: string
    startTime?: { gte: Date }
    endTime?: { lte: Date }
  } = { teacherId }

  if (start) where.startTime = { gte: new Date(start) }
  if (end) where.endTime = { lte: new Date(end) }

  const blockedTimes = await db.teacherBlockedTime.findMany({
    where,
    orderBy: { startTime: "asc" }
  })

  return NextResponse.json(blockedTimes)
}

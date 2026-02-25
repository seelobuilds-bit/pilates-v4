import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")
  const recurringGroupId = searchParams.get("recurringGroupId")
  const futureOnly = searchParams.get("futureOnly") === "true"
  const now = new Date()

  const whereClause: {
    studioId: string
    startTime?: { gte?: Date; lte?: Date }
    recurringGroupId?: string
  } = { studioId }

  if (recurringGroupId) {
    whereClause.recurringGroupId = recurringGroupId
  }

  if (startDate || endDate) {
    whereClause.startTime = {}
    if (startDate) whereClause.startTime.gte = new Date(startDate)
    if (endDate) whereClause.startTime.lte = new Date(endDate)
  } else if (futureOnly) {
    whereClause.startTime = { gte: now }
  }

  const classes = await db.classSession.findMany({
    where: whereClause,
    include: {
      classType: true,
      teacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      },
      location: true,
      _count: { select: { bookings: true } }
    },
    orderBy: { startTime: "asc" }
  })

  return NextResponse.json(classes)
}

export async function POST() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

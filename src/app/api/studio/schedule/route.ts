import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')

  const whereClause: {
    studioId: string
    startTime?: { gte?: Date; lte?: Date }
  } = {
    studioId: session.user.studioId
  }

  if (startDate || endDate) {
    whereClause.startTime = {}
    if (startDate) {
      whereClause.startTime.gte = new Date(startDate)
    }
    if (endDate) {
      whereClause.startTime.lte = new Date(endDate)
    }
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

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { classTypeId, teacherId, locationId, startTime, endTime, capacity } = body

    // Verify the class type, teacher, and location belong to this studio
    const [classType, teacher, location] = await Promise.all([
      db.classType.findFirst({
        where: { id: classTypeId, studioId: session.user.studioId }
      }),
      db.teacher.findFirst({
        where: { id: teacherId, studioId: session.user.studioId }
      }),
      db.location.findFirst({
        where: { id: locationId, studioId: session.user.studioId }
      })
    ])

    if (!classType || !teacher || !location) {
      return NextResponse.json({ error: "Invalid class type, teacher, or location" }, { status: 400 })
    }

    const classSession = await db.classSession.create({
      data: {
        studioId: session.user.studioId,
        classTypeId,
        teacherId,
        locationId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity
      },
      include: {
        classType: true,
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        location: true
      }
    })

    return NextResponse.json(classSession)
  } catch (error) {
    console.error("Failed to create class session:", error)
    return NextResponse.json({ error: "Failed to create class session" }, { status: 500 })
  }
}

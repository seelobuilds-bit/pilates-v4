import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch teacher's blocked times
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  try {
    const where: {
      teacherId: string
      startTime?: { gte: Date }
      endTime?: { lte: Date }
    } = {
      teacherId: session.user.teacherId
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

// POST - Create new blocked time (supports single day or date range)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized - Please log out and log back in" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { startTime, endTime, reason, isRecurring, recurringDays, startDate, endDate, dailyStartTime, dailyEndTime } = body

    // Handle date range (multiple days)
    if (startDate && endDate && dailyStartTime && dailyEndTime) {
      const blockedTimesToCreate: Array<{
        teacherId: string
        startTime: Date
        endTime: Date
        reason: string | null
        isRecurring: boolean
        recurringDays: number[]
      }> = []

      const currentDate = new Date(startDate)
      const lastDate = new Date(endDate)
      const [startHour, startMin] = dailyStartTime.split(":").map(Number)
      const [endHour, endMin] = dailyEndTime.split(":").map(Number)

      // Generate blocked time for each day in the range
      while (currentDate <= lastDate) {
        const dayStart = new Date(currentDate)
        dayStart.setHours(startHour, startMin, 0, 0)

        const dayEnd = new Date(currentDate)
        dayEnd.setHours(endHour, endMin, 0, 0)

        // Check for conflicting classes on this day
        const conflictingClasses = await db.classSession.findMany({
          where: {
            teacherId: session.user.teacherId,
            OR: [
              { startTime: { gte: dayStart, lt: dayEnd } },
              { endTime: { gt: dayStart, lte: dayEnd } },
              { AND: [{ startTime: { lte: dayStart } }, { endTime: { gte: dayEnd } }] }
            ]
          },
          include: { classType: true }
        })

        if (conflictingClasses.length === 0) {
          blockedTimesToCreate.push({
            teacherId: session.user.teacherId,
            startTime: dayStart,
            endTime: dayEnd,
            reason: reason || null,
            isRecurring: false,
            recurringDays: []
          })
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (blockedTimesToCreate.length === 0) {
        return NextResponse.json({ 
          error: "All days in the range have classes scheduled. Please cancel them first or choose different dates."
        }, { status: 400 })
      }

      // Create all blocked times
      const created = await db.teacherBlockedTime.createMany({
        data: blockedTimesToCreate
      })

      return NextResponse.json({ 
        success: true, 
        count: created.count,
        message: `Blocked ${created.count} days`
      })
    }

    // Single day blocking (original logic)
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
    }

    // Check if there are any classes scheduled during this time
    const conflictingClasses = await db.classSession.findMany({
      where: {
        teacherId: session.user.teacherId,
        OR: [
          { startTime: { gte: start, lt: end } },
          { endTime: { gt: start, lte: end } },
          { AND: [{ startTime: { lte: start } }, { endTime: { gte: end } }] }
        ]
      },
      include: { classType: true }
    })

    if (conflictingClasses.length > 0) {
      return NextResponse.json({ 
        error: "You have classes scheduled during this time. Please cancel them first or choose a different time.",
        conflicts: conflictingClasses.map(c => ({
          id: c.id,
          name: c.classType.name,
          startTime: c.startTime
        }))
      }, { status: 400 })
    }

    const blockedTime = await db.teacherBlockedTime.create({
      data: {
        teacherId: session.user.teacherId,
        startTime: start,
        endTime: end,
        reason: reason || null,
        isRecurring: isRecurring || false,
        recurringDays: recurringDays || []
      }
    })

    return NextResponse.json(blockedTime)
  } catch (error) {
    console.error("Failed to create blocked time:", error)
    return NextResponse.json({ error: "Failed to create blocked time" }, { status: 500 })
  }
}

// DELETE - Remove a blocked time
export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Blocked time ID required" }, { status: 400 })
  }

  try {
    // Verify the blocked time belongs to this teacher
    const blockedTime = await db.teacherBlockedTime.findFirst({
      where: {
        id,
        teacherId: session.user.teacherId
      }
    })

    if (!blockedTime) {
      return NextResponse.json({ error: "Blocked time not found" }, { status: 404 })
    }

    await db.teacherBlockedTime.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete blocked time:", error)
    return NextResponse.json({ error: "Failed to delete blocked time" }, { status: 500 })
  }
}



























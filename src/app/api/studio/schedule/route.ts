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
    const { classTypeId, teacherId, locationId, startTime, endTime, capacity, recurring } = body

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

    // Helper function to check for blocked time conflicts
    const checkBlockedTimeConflict = async (teacherIdToCheck: string, start: Date, end: Date) => {
      const blockedTimes = await db.teacherBlockedTime.findMany({
        where: {
          teacherId: teacherIdToCheck,
          OR: [
            { startTime: { gte: start, lt: end } },
            { endTime: { gt: start, lte: end } },
            { AND: [{ startTime: { lte: start } }, { endTime: { gte: end } }] }
          ]
        }
      })
      return blockedTimes
    }

    // Check single class for blocked time conflict
    const singleClassStart = new Date(startTime)
    const singleClassEnd = new Date(endTime)
    const singleConflicts = await checkBlockedTimeConflict(teacherId, singleClassStart, singleClassEnd)
    
    if (singleConflicts.length > 0 && !recurring) {
      return NextResponse.json({ 
        error: "Teacher has blocked off this time. Please choose a different time or teacher.",
        blockedTimes: singleConflicts.map(bt => ({
          startTime: bt.startTime,
          endTime: bt.endTime,
          reason: bt.reason
        }))
      }, { status: 400 })
    }

    // Handle recurring classes
    if (recurring && recurring.days && recurring.days.length > 0 && recurring.endDate) {
      const { days, endDate: recurringEndDate, time, duration, skipFirst } = recurring
      
      // Generate all dates for the recurring series
      const startDate = new Date(startTime)
      startDate.setHours(0, 0, 0, 0)
      
      // If skipFirst is true, start from the next day (for adding recurring to existing class)
      if (skipFirst) {
        startDate.setDate(startDate.getDate() + 1)
      }
      
      const endDateObj = new Date(recurringEndDate + "T23:59:59")
      
      const classesToCreate: Array<{
        studioId: string
        classTypeId: string
        teacherId: string
        locationId: string
        startTime: Date
        endTime: Date
        capacity: number
      }> = []
      
      // Parse time
      const [hours, minutes] = time.split(":").map(Number)
      
      // Iterate through each day from start to end
      const current = new Date(startDate)
      while (current <= endDateObj) {
        if (days.includes(current.getDay())) {
          const classStart = new Date(current)
          classStart.setHours(hours, minutes, 0, 0)
          
          const classEnd = new Date(classStart.getTime() + duration * 60000)
          
          classesToCreate.push({
            studioId: session.user.studioId,
            classTypeId,
            teacherId,
            locationId,
            startTime: classStart,
            endTime: classEnd,
            capacity
          })
        }
        current.setDate(current.getDate() + 1)
      }
      
      // Check for blocked time conflicts in recurring classes
      const blockedTimeConflicts: Array<{ date: Date; reason: string | null }> = []
      for (const classToCreate of classesToCreate) {
        const conflicts = await checkBlockedTimeConflict(teacherId, classToCreate.startTime, classToCreate.endTime)
        if (conflicts.length > 0) {
          blockedTimeConflicts.push({
            date: classToCreate.startTime,
            reason: conflicts[0].reason
          })
        }
      }

      // Filter out classes that conflict with blocked times
      const validClasses = classesToCreate.filter(c => {
        return !blockedTimeConflicts.some(bc => bc.date.getTime() === c.startTime.getTime())
      })
      
      // Create all valid classes in a transaction
      if (validClasses.length > 0) {
        await db.classSession.createMany({
          data: validClasses
        })
        
        const response: {
          success: boolean
          count: number
          message: string
          skipped?: number
          skippedDates?: Array<{ date: Date; reason: string | null }>
        } = { 
          success: true, 
          count: validClasses.length,
          message: `Created ${validClasses.length} classes`
        }

        if (blockedTimeConflicts.length > 0) {
          response.skipped = blockedTimeConflicts.length
          response.skippedDates = blockedTimeConflicts
          response.message += ` (${blockedTimeConflicts.length} skipped due to blocked times)`
        }
        
        return NextResponse.json(response)
      }
      
      return NextResponse.json({ error: "No classes to create" }, { status: 400 })
    }

    // Single class creation (non-recurring)
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

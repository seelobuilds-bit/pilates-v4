import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const recurringGroupId = searchParams.get('recurringGroupId')
  const futureOnly = searchParams.get('futureOnly') === 'true'

  const whereClause: {
    studioId: string
    startTime?: { gte?: Date; lte?: Date }
    recurringGroupId?: string
  } = {
    studioId: session.user.studioId
  }

  // Filter by recurring group
  if (recurringGroupId) {
    whereClause.recurringGroupId = recurringGroupId
    if (futureOnly) {
      whereClause.startTime = { gte: new Date() }
    }
  } else if (startDate || endDate) {
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

// Helper function to check for time slot conflicts (same teacher or location)
async function checkTimeSlotConflicts(
  studioId: string,
  teacherId: string,
  locationId: string,
  startTime: Date,
  endTime: Date,
  excludeClassId?: string
) {
  const conflicts = await db.classSession.findMany({
    where: {
      studioId,
      id: excludeClassId ? { not: excludeClassId } : undefined,
      OR: [
        // Same teacher at overlapping time
        {
          teacherId,
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        },
        // Same location at overlapping time
        {
          locationId,
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      ]
    },
    include: {
      classType: { select: { name: true } },
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
      location: { select: { name: true } }
    }
  })
  
  return conflicts
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
      
      // Generate a unique group ID for this recurring series
      const recurringGroupId = crypto.randomUUID()
      
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
        recurringGroupId: string
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
            capacity,
            recurringGroupId
          })
        }
        current.setDate(current.getDate() + 1)
      }
      
      // Check for blocked time conflicts and existing class conflicts
      const blockedTimeConflicts: Array<{ date: Date; reason: string | null }> = []
      const scheduleConflicts: Array<{ date: Date; conflictType: string; details: string }> = []
      
      for (const classToCreate of classesToCreate) {
        // Check blocked times
        const blockedConflicts = await checkBlockedTimeConflict(teacherId, classToCreate.startTime, classToCreate.endTime)
        if (blockedConflicts.length > 0) {
          blockedTimeConflicts.push({
            date: classToCreate.startTime,
            reason: blockedConflicts[0].reason
          })
          continue
        }
        
        // Check for existing classes at same time (double booking prevention)
        const existingConflicts = await checkTimeSlotConflicts(
          session.user.studioId,
          teacherId,
          locationId,
          classToCreate.startTime,
          classToCreate.endTime
        )
        if (existingConflicts.length > 0) {
          const conflict = existingConflicts[0]
          scheduleConflicts.push({
            date: classToCreate.startTime,
            conflictType: conflict.teacherId === teacherId ? 'teacher' : 'location',
            details: `${conflict.classType.name} at ${conflict.location.name}`
          })
        }
      }

      // Filter out classes that conflict with blocked times or existing classes
      const validClasses = classesToCreate.filter(c => {
        const hasBlockedConflict = blockedTimeConflicts.some(bc => bc.date.getTime() === c.startTime.getTime())
        const hasScheduleConflict = scheduleConflicts.some(sc => sc.date.getTime() === c.startTime.getTime())
        return !hasBlockedConflict && !hasScheduleConflict
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
          recurringGroupId: string
          skipped?: number
          skippedDates?: Array<{ date: Date; reason: string | null }>
          conflicts?: Array<{ date: Date; conflictType: string; details: string }>
        } = { 
          success: true, 
          count: validClasses.length,
          message: `Created ${validClasses.length} classes`,
          recurringGroupId
        }

        if (blockedTimeConflicts.length > 0) {
          response.skipped = blockedTimeConflicts.length
          response.skippedDates = blockedTimeConflicts
          response.message += ` (${blockedTimeConflicts.length} skipped due to blocked times)`
        }
        
        if (scheduleConflicts.length > 0) {
          response.conflicts = scheduleConflicts
          response.message += ` (${scheduleConflicts.length} skipped due to schedule conflicts)`
        }
        
        return NextResponse.json(response)
      }
      
      return NextResponse.json({ 
        error: "No classes to create - all time slots have conflicts",
        blockedTimeConflicts,
        scheduleConflicts
      }, { status: 400 })
    }

    // Check for time slot conflicts before creating single class
    const existingConflicts = await checkTimeSlotConflicts(
      session.user.studioId,
      teacherId,
      locationId,
      new Date(startTime),
      new Date(endTime)
    )
    
    if (existingConflicts.length > 0) {
      const conflictDetails = existingConflicts.map(c => ({
        type: c.teacherId === teacherId ? 'teacher' : 'location',
        className: c.classType.name,
        time: c.startTime,
        teacher: `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
        location: c.location.name
      }))
      
      return NextResponse.json({ 
        error: "Time slot conflict detected",
        conflicts: conflictDetails,
        message: `This time slot conflicts with: ${conflictDetails.map(c => 
          c.type === 'teacher' 
            ? `${c.teacher} is already teaching ${c.className}` 
            : `${c.location} is already booked for ${c.className}`
        ).join(', ')}`
      }, { status: 400 })
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

// Bulk delete classes
export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { classIds, recurringGroupId, futureOnly } = body

    // If deleting by recurring group
    if (recurringGroupId) {
      const whereClause: {
        studioId: string
        recurringGroupId: string
        startTime?: { gte: Date }
      } = {
        studioId: session.user.studioId,
        recurringGroupId
      }

      // If futureOnly, only delete classes that haven't started yet
      if (futureOnly) {
        whereClause.startTime = { gte: new Date() }
      }

      // First check for bookings
      const classesWithBookings = await db.classSession.findMany({
        where: whereClause,
        include: {
          _count: { select: { bookings: true } }
        }
      })

      const classesWithActiveBookings = classesWithBookings.filter(c => c._count.bookings > 0)
      
      if (classesWithActiveBookings.length > 0) {
        return NextResponse.json({ 
          error: "Some classes have bookings",
          classesWithBookings: classesWithActiveBookings.length,
          totalBookings: classesWithActiveBookings.reduce((sum, c) => sum + c._count.bookings, 0),
          message: `${classesWithActiveBookings.length} classes have active bookings. Cancel bookings first or use force delete.`
        }, { status: 400 })
      }

      const result = await db.classSession.deleteMany({
        where: whereClause
      })

      return NextResponse.json({ 
        success: true, 
        deleted: result.count,
        message: `Deleted ${result.count} classes from recurring series`
      })
    }

    // If deleting by class IDs
    if (classIds && classIds.length > 0) {
      // Verify all classes belong to this studio
      const classes = await db.classSession.findMany({
        where: {
          id: { in: classIds },
          studioId: session.user.studioId
        },
        include: {
          _count: { select: { bookings: true } }
        }
      })

      if (classes.length !== classIds.length) {
        return NextResponse.json({ error: "Some classes not found or unauthorized" }, { status: 400 })
      }

      const classesWithActiveBookings = classes.filter(c => c._count.bookings > 0)
      
      if (classesWithActiveBookings.length > 0) {
        return NextResponse.json({ 
          error: "Some classes have bookings",
          classesWithBookings: classesWithActiveBookings.length,
          totalBookings: classesWithActiveBookings.reduce((sum, c) => sum + c._count.bookings, 0),
          message: `${classesWithActiveBookings.length} classes have active bookings. Cancel bookings first.`
        }, { status: 400 })
      }

      const result = await db.classSession.deleteMany({
        where: {
          id: { in: classIds },
          studioId: session.user.studioId
        }
      })

      return NextResponse.json({ 
        success: true, 
        deleted: result.count,
        message: `Deleted ${result.count} classes`
      })
    }

    return NextResponse.json({ error: "No class IDs or recurring group ID provided" }, { status: 400 })
  } catch (error) {
    console.error("Failed to delete classes:", error)
    return NextResponse.json({ error: "Failed to delete classes" }, { status: 500 })
  }
}

// Bulk reassign classes (change teacher)
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { classIds, recurringGroupId, futureOnly, teacherId, locationId } = body

    if (!teacherId && !locationId) {
      return NextResponse.json({ error: "Must provide teacherId or locationId to update" }, { status: 400 })
    }

    // Verify new teacher/location belongs to studio
    if (teacherId) {
      const teacher = await db.teacher.findFirst({
        where: { id: teacherId, studioId: session.user.studioId }
      })
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 400 })
      }
    }

    if (locationId) {
      const location = await db.location.findFirst({
        where: { id: locationId, studioId: session.user.studioId }
      })
      if (!location) {
        return NextResponse.json({ error: "Location not found" }, { status: 400 })
      }
    }

    // Build update data
    const updateData: { teacherId?: string; locationId?: string } = {}
    if (teacherId) updateData.teacherId = teacherId
    if (locationId) updateData.locationId = locationId

    // If updating by recurring group
    if (recurringGroupId) {
      const whereClause: {
        studioId: string
        recurringGroupId: string
        startTime?: { gte: Date }
      } = {
        studioId: session.user.studioId,
        recurringGroupId
      }

      if (futureOnly) {
        whereClause.startTime = { gte: new Date() }
      }

      const result = await db.classSession.updateMany({
        where: whereClause,
        data: updateData
      })

      return NextResponse.json({ 
        success: true, 
        updated: result.count,
        message: `Updated ${result.count} classes in recurring series`
      })
    }

    // If updating by class IDs
    if (classIds && classIds.length > 0) {
      // Verify all classes belong to this studio
      const classCount = await db.classSession.count({
        where: {
          id: { in: classIds },
          studioId: session.user.studioId
        }
      })

      if (classCount !== classIds.length) {
        return NextResponse.json({ error: "Some classes not found or unauthorized" }, { status: 400 })
      }

      const result = await db.classSession.updateMany({
        where: {
          id: { in: classIds },
          studioId: session.user.studioId
        },
        data: updateData
      })

      return NextResponse.json({ 
        success: true, 
        updated: result.count,
        message: `Updated ${result.count} classes`
      })
    }

    return NextResponse.json({ error: "No class IDs or recurring group ID provided" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update classes:", error)
    return NextResponse.json({ error: "Failed to update classes" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch classes taught by a teacher in a date range (for invoicing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getSession()
  const { teacherId } = await params

  console.log("[Invoice Classes API] Session:", {
    userId: session?.user?.id,
    studioId: session?.user?.studioId,
    role: session?.user?.role
  })

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    console.log("[Invoice Classes API] No studioId in session!")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Start and end dates required" }, { status: 400 })
  }

  try {
    // Verify teacher belongs to this studio
    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      },
      include: {
        payRate: true
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Parse dates - ensure we include the full day range
    // Use explicit date parts to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
    
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)

    console.log("[Invoice Classes API] Query params:", {
      teacherId,
      studioId: session.user.studioId,
      start: start.toISOString(),
      end: end.toISOString()
    })

    // Fetch classes in the date range
    const classes = await db.classSession.findMany({
      where: {
        teacherId,
        studioId: session.user.studioId,
        startTime: {
          gte: start,
          lte: end
        }
      },
      include: {
        classType: true,
        location: true,
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { startTime: "asc" }
    })

    console.log("[Invoice Classes API] Found classes:", classes.length)

    // Get pay rate
    const payRate = teacher.payRate || { type: "PER_CLASS", rate: 0 }

    // Calculate earnings for each class
    const classesWithEarnings = classes.map(cls => {
      let earnings = 0
      
      switch (payRate.type) {
        case "PER_CLASS":
          earnings = payRate.rate
          break
        case "PER_HOUR":
          const hours = (new Date(cls.endTime).getTime() - new Date(cls.startTime).getTime()) / (1000 * 60 * 60)
          earnings = payRate.rate * hours
          break
        case "PER_STUDENT":
          earnings = payRate.rate * cls._count.bookings
          break
        case "PERCENTAGE":
          // Would need pricing info - for now just use a placeholder
          earnings = 0
          break
      }

      return {
        id: cls.id,
        date: cls.startTime,
        startTime: cls.startTime,
        endTime: cls.endTime,
        classType: cls.classType.name,
        classTypeId: cls.classType.id,
        location: cls.location.name,
        students: cls._count.bookings,
        capacity: cls.capacity,
        earnings: Math.round(earnings * 100) / 100
      }
    })

    // Summary stats
    const totalClasses = classes.length
    const totalStudents = classes.reduce((sum, cls) => sum + cls._count.bookings, 0)
    const totalEarnings = classesWithEarnings.reduce((sum, cls) => sum + cls.earnings, 0)

    return NextResponse.json({
      classes: classesWithEarnings,
      summary: {
        totalClasses,
        totalStudents,
        totalEarnings: Math.round(totalEarnings * 100) / 100
      },
      payRate: {
        type: payRate.type,
        rate: payRate.rate
      },
      debug: {
        teacherId,
        studioId: session.user.studioId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        classCount: classes.length
      }
    })
  } catch (error) {
    console.error("Failed to fetch classes:", error)
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
  }
}
























import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teacherId } = await params

    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        classSessions: {
          where: {
            startTime: { gte: new Date() }
          },
          orderBy: { startTime: "asc" },
          take: 5,
          include: {
            classType: { select: { name: true } },
            location: { select: { name: true } },
            _count: { select: { bookings: true } }
          }
        },
        _count: {
          select: { classSessions: true }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Calculate stats
    const totalBookings = await db.booking.count({
      where: {
        classSession: {
          teacherId: teacher.id
        }
      }
    })

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const classesThisMonth = await db.classSession.count({
      where: {
        teacherId: teacher.id,
        startTime: { gte: thisMonthStart }
      }
    })

    return NextResponse.json({
      ...teacher,
      upcomingClasses: teacher.classSessions,
      stats: {
        totalClasses: teacher._count.classSessions,
        totalStudents: totalBookings,
        averageRating: 4.8, // Placeholder - would need a ratings table
        thisMonth: classesThisMonth
      }
    })
  } catch (error) {
    console.error("Error fetching teacher:", error)
    return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teacherId } = await params
    const body = await request.json()

    // Verify teacher belongs to studio
    const existingTeacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      }
    })

    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const updatedTeacher = await db.teacher.update({
      where: { id: teacherId },
      data: {
        bio: body.bio,
        specialties: body.specialties,
        isActive: body.isActive
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedTeacher)
  } catch (error) {
    console.error("Error updating teacher:", error)
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 })
  }
}

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { teacherId } = await params

    // Verify teacher belongs to studio
    const existingTeacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      },
      include: {
        _count: {
          select: {
            classSessions: true // Check ALL class sessions, not just future
          }
        }
      }
    })

    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Check for any classes (past or future) - we can't delete teacher if they have class history
    if (existingTeacher._count.classSessions > 0) {
      // Count future classes specifically for the message
      const futureClassCount = await db.classSession.count({
        where: {
          teacherId,
          startTime: { gte: new Date() }
        }
      })
      
      if (futureClassCount > 0) {
        return NextResponse.json({ 
          error: `Cannot delete teacher with ${futureClassCount} upcoming classes. Please reassign or cancel their classes first.`
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: `Cannot delete teacher with class history (${existingTeacher._count.classSessions} total classes). Consider deactivating them instead.`
      }, { status: 400 })
    }

    // Delete all related records in a transaction
    await db.$transaction(async (tx) => {
      // Delete blocked times (cascade should handle this but being explicit)
      await tx.teacherBlockedTime.deleteMany({
        where: { teacherId }
      })
      
      // Delete pay rate if exists
      await tx.teacherPayRate.deleteMany({
        where: { teacherId }
      })
      
      // Delete invoices
      await tx.teacherInvoice.deleteMany({
        where: { teacherId }
      })
      
      // Delete class flow progress
      await tx.classFlowProgress.deleteMany({
        where: { teacherId }
      }).catch(() => {})
      
      // Delete training requests
      await tx.trainingRequest.deleteMany({
        where: { teacherId }
      }).catch(() => {})
      
      // Delete social media accounts if they exist
      await tx.socialMediaAccount.deleteMany({
        where: { teacherId }
      }).catch(() => {})
      
      // Delete social tracking links
      await tx.socialMediaTrackingLink.deleteMany({
        where: { teacherId }
      }).catch(() => {})
      
      // Delete social training progress
      await tx.socialTrainingProgress.deleteMany({
        where: { teacherId }
      }).catch(() => {})
      
      // Delete social homework submissions
      await tx.socialHomeworkSubmission.deleteMany({
        where: { teacherId }
      }).catch(() => {})
      
      // Finally delete the teacher
      await tx.teacher.delete({
        where: { id: teacherId }
      })
    })

    return NextResponse.json({ success: true, message: "Teacher deleted successfully" })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 })
  }
}

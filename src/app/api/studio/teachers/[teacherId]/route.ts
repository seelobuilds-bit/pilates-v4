import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
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

    const allClassSessions = await db.classSession.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        classType: { select: { name: true } },
        location: { select: { name: true } },
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: "desc" }
    })

    const allBookings = await db.booking.findMany({
      where: {
        classSession: {
          teacherId: teacher.id
        }
      },
      include: {
        classSession: {
          include: {
            classType: { select: { name: true, price: true } },
            location: { select: { name: true } }
          }
        },
        client: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const classesThisMonth = allClassSessions.filter(
      (session) => new Date(session.startTime) >= thisMonthStart
    ).length

    const uniqueStudents = new Set(allBookings.map((booking) => booking.clientId))
    const nonCancelledBookings = allBookings.filter((booking) => booking.status !== "CANCELLED")
    const completedBookings = allBookings.filter((booking) => booking.status === "COMPLETED").length

    const revenue = nonCancelledBookings.reduce((sum, booking) => {
      const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
      return sum + amount
    }, 0)

    const avgClassSize =
      allClassSessions.length > 0
        ? Math.round((nonCancelledBookings.length / allClassSessions.length) * 10) / 10
        : 0

    const completionRate =
      nonCancelledBookings.length > 0
        ? Math.round((completedBookings / nonCancelledBookings.length) * 100)
        : 0

    const clientBookingCounts = new Map<string, number>()
    for (const booking of nonCancelledBookings) {
      const name = `${booking.client.firstName} ${booking.client.lastName}`.trim()
      clientBookingCounts.set(name, (clientBookingCounts.get(name) || 0) + 1)
    }

    const repeatClientCount = Array.from(clientBookingCounts.values()).filter((count) => count > 1).length
    const retentionRate =
      clientBookingCounts.size > 0 ? Math.round((repeatClientCount / clientBookingCounts.size) * 100) : 0

    const classCounts = new Map<string, number>()
    const locationCounts = new Map<string, number>()
    for (const session of allClassSessions) {
      classCounts.set(session.classType.name, (classCounts.get(session.classType.name) || 0) + 1)
      locationCounts.set(session.location.name, (locationCounts.get(session.location.name) || 0) + 1)
    }

    const now = new Date()
    const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleDateString("en-US", { month: "short" }),
        count: 0
      }
    })
    const monthLookup = new Map(monthlyBuckets.map((bucket) => [bucket.key, bucket]))
    for (const session of allClassSessions) {
      const date = new Date(session.startTime)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = monthLookup.get(key)
      if (bucket) {
        bucket.count += 1
      }
    }

    const topClients = Array.from(clientBookingCounts.entries())
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    const extendedStats = {
      revenue: Math.round(revenue * 100) / 100,
      retentionRate,
      avgClassSize,
      completionRate,
      classBreakdown: Array.from(classCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      locationBreakdown: Array.from(locationCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      monthlyClasses: monthlyBuckets.map(({ month, count }) => ({ month, count })),
      recentReviews: [] as Array<{ clientName: string; rating: number; comment: string; date: string }>,
      topClients
    }

    return NextResponse.json({
      ...teacher,
      upcomingClasses: teacher.classSessions,
      stats: {
        totalClasses: teacher._count.classSessions,
        totalStudents: uniqueStudents.size,
        averageRating: 0,
        thisMonth: classesThisMonth
      },
      extendedStats
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
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
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
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
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
        where: { requestedById: teacherId }
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

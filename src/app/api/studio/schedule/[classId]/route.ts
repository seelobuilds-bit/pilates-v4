import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendSystemTemplateEmail } from "@/lib/email"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await getSession()
  const { classId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classSession = await db.classSession.findFirst({
    where: {
      id: classId,
      studioId: session.user.studioId
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
      location: true,
      bookings: {
        where: { status: "CONFIRMED" },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          }
        }
      },
      _count: { select: { bookings: true } }
    }
  })

  if (!classSession) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  return NextResponse.json(classSession)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await getSession()
  const { classId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { startTime, endTime, capacity, teacherId, locationId } = body

    // Verify the class belongs to this studio
    const existingClass = await db.classSession.findFirst({
      where: {
        id: classId,
        studioId: session.user.studioId
      },
      include: {
        _count: { select: { bookings: true } }
      }
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Ensure capacity isn't reduced below current bookings
    if (capacity < existingClass._count.bookings) {
      return NextResponse.json({ 
        error: `Cannot reduce capacity below current bookings (${existingClass._count.bookings})` 
      }, { status: 400 })
    }

    const updated = await db.classSession.update({
      where: { id: classId },
      data: {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        capacity,
        teacherId,
        locationId
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update class session:", error)
    return NextResponse.json({ error: "Failed to update class session" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await getSession()
  const { classId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get the class with all details needed for notifications
    const existingClass = await db.classSession.findFirst({
      where: {
        id: classId,
        studioId: session.user.studioId
      },
      include: {
        studio: { select: { name: true } },
        classType: { select: { name: true } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        location: { select: { name: true } },
        bookings: {
          where: { status: { in: ["CONFIRMED", "PENDING"] } },
          include: {
            client: { select: { email: true, firstName: true } }
          }
        },
        waitlists: {
          where: { status: "WAITING" },
          include: {
            client: { select: { email: true, firstName: true } }
          }
        }
      }
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Debug logging
    console.log(`[CLASS DELETE] Class ID: ${classId}`)
    console.log(`[CLASS DELETE] Studio ID: ${session.user.studioId}`)
    console.log(`[CLASS DELETE] Found ${existingClass.bookings.length} bookings with CONFIRMED/PENDING status`)
    console.log(`[CLASS DELETE] Bookings:`, existingClass.bookings.map(b => ({ 
      id: b.id, 
      clientEmail: b.client.email 
    })))
    
    // Check ALL bookings for this class (any status)
    const allBookings = await db.booking.findMany({
      where: { classSessionId: classId },
      select: { id: true, status: true, clientId: true }
    })
    console.log(`[CLASS DELETE] ALL bookings for this class (any status):`, allBookings)

    const dateStr = existingClass.startTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
    const timeStr = existingClass.startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    })
    const teacherName = `${existingClass.teacher.user.firstName} ${existingClass.teacher.user.lastName}`

    // Send cancellation emails to all affected clients (don't await to avoid blocking)
    const emailPromises = existingClass.bookings.map(booking => 
      sendSystemTemplateEmail({
        studioId: session.user.studioId,
        templateType: "CLASS_CANCELLED_BY_STUDIO",
        to: booking.client.email,
        variables: {
          firstName: booking.client.firstName,
          lastName: "",
          className: existingClass.classType.name,
          date: dateStr,
          time: timeStr,
          locationName: existingClass.location.name,
          teacherName,
          studioName: existingClass.studio.name
        }
      }).catch(err => console.error(`Failed to send cancellation email to ${booking.client.email}:`, err))
    )

    // Also notify people on waitlist
    const waitlistPromises = existingClass.waitlists.map(waitlist =>
      sendSystemTemplateEmail({
        studioId: session.user.studioId,
        templateType: "CLASS_CANCELLED_BY_STUDIO",
        to: waitlist.client.email,
        variables: {
          firstName: waitlist.client.firstName,
          lastName: "",
          className: existingClass.classType.name,
          date: dateStr,
          time: timeStr,
          locationName: existingClass.location.name,
          teacherName,
          studioName: existingClass.studio.name
        }
      }).catch(err => console.error(`Failed to send cancellation email to waitlist ${waitlist.client.email}:`, err))
    )

    // Fire off all emails in parallel (don't block the response)
    Promise.all([...emailPromises, ...waitlistPromises])
      .then(() => console.log(`[CLASS CANCEL] Sent ${emailPromises.length + waitlistPromises.length} cancellation emails`))
      .catch(err => console.error("[CLASS CANCEL] Some emails failed:", err))

    // Use a transaction to ensure all operations succeed together
    await db.$transaction(async (tx) => {
      // Delete waitlist entries first
      await tx.waitlist.deleteMany({
        where: { classSessionId: classId }
      })

      // Delete bookings (we've already sent cancellation emails)
      // We delete instead of update to avoid foreign key issues
      await tx.booking.deleteMany({
        where: { classSessionId: classId }
      })

      // Delete the class session
      await tx.classSession.delete({
        where: { id: classId }
      })
    })

    return NextResponse.json({ 
      success: true,
      notifiedClients: existingClass.bookings.length,
      notifiedWaitlist: existingClass.waitlists.length
    })
  } catch (error) {
    console.error("Failed to delete class session:", error)
    return NextResponse.json({ error: "Failed to delete class session" }, { status: 500 })
  }
}

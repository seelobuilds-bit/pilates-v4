import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

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
    // Verify the class belongs to this studio
    const existingClass = await db.classSession.findFirst({
      where: {
        id: classId,
        studioId: session.user.studioId
      }
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Delete associated bookings first
    await db.booking.deleteMany({
      where: { classSessionId: classId }
    })

    // Delete the class session
    await db.classSession.delete({
      where: { id: classId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete class session:", error)
    return NextResponse.json({ error: "Failed to delete class session" }, { status: 500 })
  }
}

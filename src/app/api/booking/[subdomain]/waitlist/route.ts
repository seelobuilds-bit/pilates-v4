import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"

// POST - Join waitlist for a class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Please sign in to join waitlist" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { classSessionId } = body

    // Get the class session
    const classSession = await db.classSession.findFirst({
      where: { id: classSessionId, studioId: studio.id },
      include: {
        classType: true,
        _count: { 
          select: { 
            bookings: { where: { status: { in: ["CONFIRMED", "PENDING"] } } },
            waitlists: { where: { status: "WAITING" } }
          }
        }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if class has started
    if (new Date(classSession.startTime) < new Date()) {
      return NextResponse.json({ error: "This class has already started" }, { status: 400 })
    }

    // Check if client already has a booking for this class
    const existingBooking = await db.booking.findFirst({
      where: {
        clientId: decoded.clientId,
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] }
      }
    })

    if (existingBooking) {
      return NextResponse.json({ 
        error: "You already have a booking for this class" 
      }, { status: 400 })
    }

    // Check if client is already on waitlist
    const existingWaitlist = await db.waitlist.findUnique({
      where: {
        clientId_classSessionId: {
          clientId: decoded.clientId,
          classSessionId: classSession.id
        }
      }
    })

    if (existingWaitlist && existingWaitlist.status === "WAITING") {
      return NextResponse.json({ 
        error: "You are already on the waitlist for this class",
        position: existingWaitlist.position
      }, { status: 400 })
    }

    // Check if class actually needs a waitlist (is it full?)
    const isClassFull = classSession._count.bookings >= classSession.capacity

    if (!isClassFull) {
      return NextResponse.json({ 
        error: "Class has available spots. Please book directly.",
        spotsLeft: classSession.capacity - classSession._count.bookings
      }, { status: 400 })
    }

    // Get next position in waitlist
    const lastWaitlistEntry = await db.waitlist.findFirst({
      where: {
        classSessionId: classSession.id,
        status: "WAITING"
      },
      orderBy: { position: "desc" }
    })

    const nextPosition = (lastWaitlistEntry?.position || 0) + 1

    // Create waitlist entry
    const waitlistEntry = await db.waitlist.create({
      data: {
        studioId: studio.id,
        clientId: decoded.clientId,
        classSessionId: classSession.id,
        position: nextPosition,
        status: "WAITING"
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      waitlistId: waitlistEntry.id,
      position: nextPosition,
      totalOnWaitlist: classSession._count.waitlists + 1,
      classDetails: {
        name: waitlistEntry.classSession.classType.name,
        startTime: waitlistEntry.classSession.startTime,
        location: waitlistEntry.classSession.location.name,
        teacher: `${waitlistEntry.classSession.teacher.user.firstName} ${waitlistEntry.classSession.teacher.user.lastName}`
      },
      message: `You are #${nextPosition} on the waitlist. We'll notify you if a spot opens up.`
    })
  } catch (error) {
    console.error("Waitlist join error:", error)
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 })
  }
}

// GET - Get client's waitlist entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const waitlistEntries = await db.waitlist.findMany({
      where: {
        clientId: decoded.clientId,
        studioId: studio.id,
        status: { in: ["WAITING", "NOTIFIED"] }
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(waitlistEntries.map(entry => ({
      id: entry.id,
      position: entry.position,
      status: entry.status,
      notifiedAt: entry.notifiedAt,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
      classSession: {
        id: entry.classSession.id,
        startTime: entry.classSession.startTime,
        endTime: entry.classSession.endTime,
        classType: entry.classSession.classType.name,
        teacher: `${entry.classSession.teacher.user.firstName} ${entry.classSession.teacher.user.lastName}`,
        location: entry.classSession.location.name
      }
    })))
  } catch (error) {
    console.error("Waitlist fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 })
  }
}

// DELETE - Leave waitlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const { searchParams } = new URL(request.url)
    const waitlistId = searchParams.get("id")

    if (!waitlistId) {
      return NextResponse.json({ error: "Waitlist ID required" }, { status: 400 })
    }
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Find and verify the waitlist entry belongs to this client
    const waitlistEntry = await db.waitlist.findFirst({
      where: {
        id: waitlistId,
        clientId: decoded.clientId,
        studioId: studio.id
      }
    })

    if (!waitlistEntry) {
      return NextResponse.json({ error: "Waitlist entry not found" }, { status: 404 })
    }

    if (waitlistEntry.status !== "WAITING" && waitlistEntry.status !== "NOTIFIED") {
      return NextResponse.json({ error: "Cannot cancel this waitlist entry" }, { status: 400 })
    }

    // Update status to CANCELLED
    await db.waitlist.update({
      where: { id: waitlistId },
      data: { status: "CANCELLED" }
    })

    // Reorder remaining waitlist entries
    await db.waitlist.updateMany({
      where: {
        classSessionId: waitlistEntry.classSessionId,
        status: "WAITING",
        position: { gt: waitlistEntry.position }
      },
      data: {
        position: { decrement: 1 }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Removed from waitlist"
    })
  } catch (error) {
    console.error("Waitlist leave error:", error)
    return NextResponse.json({ error: "Failed to leave waitlist" }, { status: 500 })
  }
}

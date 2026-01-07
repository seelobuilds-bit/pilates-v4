import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { clientId } = await params
    const teacherId = session.user.teacherId

    // Verify this client has booked the teacher's classes
    const hasBooking = await db.booking.findFirst({
      where: {
        clientId,
        classSession: {
          teacherId
        }
      }
    })

    if (!hasBooking) {
      return NextResponse.json({ 
        error: "You can only view clients who have booked your classes" 
      }, { status: 403 })
    }

    // Get client details
    const client = await db.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get booking stats for this teacher
    const bookings = await db.booking.findMany({
      where: {
        clientId,
        classSession: {
          teacherId
        }
      },
      include: {
        classSession: {
          include: {
            classType: true
          }
        }
      },
      orderBy: {
        classSession: {
          startTime: "desc"
        }
      }
    })

    const bookingsCount = bookings.length
    const lastBooking = bookings[0]?.classSession.startTime || null

    // Get upcoming bookings with this teacher
    const upcomingBookings = await db.booking.findMany({
      where: {
        clientId,
        classSession: {
          teacherId,
          startTime: { gte: new Date() }
        },
        status: { in: ["PENDING", "CONFIRMED"] }
      },
      include: {
        classSession: {
          include: {
            classType: true
          }
        }
      },
      orderBy: {
        classSession: {
          startTime: "asc"
        }
      },
      take: 5
    })

    // Get ALL messages for this client (shared inbox)
    // This includes messages from HQ, other teachers, studio admins, etc.
    const messages = await db.message.findMany({
      where: {
        clientId,
        studioId: client.studioId
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 100
    })

    // Format messages with sender info
    // We'll add sender info based on fromName field which we set when sending
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      channel: msg.channel,
      direction: msg.direction,
      subject: msg.subject,
      body: msg.body,
      fromName: msg.fromName,
      createdAt: msg.createdAt.toISOString(),
      // sentBy is derived from fromName if it was an outbound message
      sentBy: msg.direction === "OUTBOUND" && msg.fromName ? {
        firstName: msg.fromName.split(" ")[0] || "Staff",
        lastName: msg.fromName.split(" ").slice(1).join(" ") || "",
        role: "STAFF" // We could store this in the message for more detail
      } : null
    }))

    return NextResponse.json({
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        createdAt: client.createdAt.toISOString(),
        bookingsCount,
        lastBooking: lastBooking?.toISOString() || null,
        upcomingBookings: upcomingBookings.map(b => ({
          id: b.id,
          date: b.classSession.startTime.toISOString(),
          className: b.classSession.classType.name
        }))
      },
      messages: formattedMessages
    })
  } catch (error) {
    console.error("Failed to fetch client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}














import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teacherId = session.user.teacherId
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    // If clientId provided, return messages for that client
    if (clientId) {
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
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      const client = await db.client.findUnique({
        where: { id: clientId }
      })

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }

      // Get all messages for this client (shared inbox)
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

      return NextResponse.json({
        messages: messages.map(msg => ({
          id: msg.id,
          channel: msg.channel,
          direction: msg.direction,
          subject: msg.subject,
          body: msg.body,
          fromName: msg.fromName,
          createdAt: msg.createdAt.toISOString()
        }))
      })
    }

    // Get teacher's studio
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Get all clients who have booked this teacher's classes
    const bookings = await db.booking.findMany({
      where: {
        classSession: {
          teacherId
        }
      },
      select: {
        clientId: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            studioId: true
          }
        }
      },
      distinct: ['clientId']
    })

    // Get unique clients
    const clientMap = new Map()
    for (const booking of bookings) {
      if (!clientMap.has(booking.clientId)) {
        clientMap.set(booking.clientId, booking.client)
      }
    }
    const clients = Array.from(clientMap.values())

    // For each client, get their message stats
    const conversations = await Promise.all(
      clients.map(async (client) => {
        const messages = await db.message.findMany({
          where: {
            clientId: client.id,
            studioId: client.studioId
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        })

        const totalMessages = await db.message.count({
          where: {
            clientId: client.id,
            studioId: client.studioId
          }
        })

        const lastMessage = messages[0]

        return {
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientEmail: client.email,
          clientPhone: client.phone,
          lastMessage: lastMessage ? {
            channel: lastMessage.channel,
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
            direction: lastMessage.direction
          } : null,
          unreadCount: 0, // Could implement read tracking later
          totalMessages
        }
      })
    )

    // Sort by last message date (most recent first), then by those with messages
    conversations.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      }
      if (a.lastMessage) return -1
      if (b.lastMessage) return 1
      return a.clientName.localeCompare(b.clientName)
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Failed to fetch inbox:", error)
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 })
  }
}

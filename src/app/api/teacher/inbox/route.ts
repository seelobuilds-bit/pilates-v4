import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loadInboxConversationSummaries } from "@/lib/inbox-conversations"
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
        },
        select: { id: true },
      })

      if (!hasBooking) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      const client = await db.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          studioId: true,
        },
      })

      if (!client?.studioId) {
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
        take: 100,
        select: {
          id: true,
          channel: true,
          direction: true,
          status: true,
          subject: true,
          body: true,
          fromName: true,
          sentAt: true,
          createdAt: true,
        },
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
      },
      distinct: ['clientId']
    })

    const clientIds = [...new Set(bookings.map((booking) => booking.clientId).filter(Boolean))]

    const [clients, summaries] = await Promise.all([
      clientIds.length
        ? db.client.findMany({
            where: {
              id: { in: clientIds },
              studioId: teacher.studioId,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          })
        : Promise.resolve([]),
      clientIds.length
        ? loadInboxConversationSummaries({
            studioId: teacher.studioId,
            clientIds,
          })
        : Promise.resolve([]),
    ])

    const summaryByClientId = new Map(summaries.map((summary) => [summary.clientId, summary]))

    const conversations = clients.map((client) => {
      const summary = summaryByClientId.get(client.id)
      return {
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.email,
        clientPhone: client.phone,
        lastMessage: summary?.lastMessage || null,
        unreadCount: 0, // kept intentionally for teacher UI behavior
        totalMessages: summary?.messageCount || 0,
      }
    })

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









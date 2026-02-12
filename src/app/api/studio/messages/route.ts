import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendEmail, sendSMS } from "@/lib/communications"

// GET - Fetch all messages/conversations for the studio
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (clientId) {
      // Get messages for specific client
      const messages = await db.message.findMany({
        where: {
          studioId,
          clientId,
        },
        orderBy: { createdAt: "asc" },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      })
      
      return NextResponse.json({ messages })
    }

    // Get all conversations (grouped by client)
    const messages = await db.message.findMany({
      where: { studioId },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Group messages by client
    const conversationMap = new Map<string, {
      clientId: string
      client: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone: string | null
      } | null
      lastMessage: typeof messages[0]
      messageCount: number
      unreadCount: number
    }>()

    for (const message of messages) {
      if (message.clientId) {
        const existing = conversationMap.get(message.clientId)
        if (!existing) {
          conversationMap.set(message.clientId, {
            clientId: message.clientId,
            client: message.client,
            lastMessage: message,
            messageCount: 1,
            unreadCount: message.direction === "INBOUND" && !message.openedAt ? 1 : 0,
          })
        } else {
          existing.messageCount++
          if (message.direction === "INBOUND" && !message.openedAt) {
            existing.unreadCount++
          }
        }
      }
    }

    const conversations = Array.from(conversationMap.values())

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const body = await request.json()
    const { clientId, channel, subject, message: messageBody } = body

    if (!clientId || !channel || !messageBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get client details
    const client = await db.client.findFirst({
      where: { id: clientId, studioId },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    let result

    if (channel === "EMAIL") {
      if (!client.email) {
        return NextResponse.json({ error: "Client has no email address" }, { status: 400 })
      }
      
      result = await sendEmail(studioId, {
        to: client.email,
        toName: `${client.firstName} ${client.lastName}`,
        subject: subject || "Message from your studio",
        body: messageBody,
        clientId: client.id
      })
    } else if (channel === "SMS") {
      if (!client.phone) {
        return NextResponse.json({ error: "Client has no phone number" }, { status: 400 })
      }
      
      result = await sendSMS(studioId, {
        to: client.phone,
        toName: `${client.firstName} ${client.lastName}`,
        body: messageBody,
        clientId: client.id
      })
    } else {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

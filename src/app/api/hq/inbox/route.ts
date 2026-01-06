import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendHQEmailToStudio } from "@/lib/email"

// GET - List all HQ conversations with studios
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get("studioId")

    // If studioId provided, get messages for that studio
    if (studioId) {
      const studio = await db.studio.findUnique({
        where: { id: studioId },
        include: { owner: true }
      })

      if (!studio) {
        return NextResponse.json({ error: "Studio not found" }, { status: 404 })
      }

      const messages = await db.hQMessage.findMany({
        where: { studioId },
        orderBy: { createdAt: "asc" },
        take: 100
      })

      return NextResponse.json({
        studio: {
          id: studio.id,
          name: studio.name,
          ownerName: `${studio.owner.firstName} ${studio.owner.lastName}`,
          ownerEmail: studio.owner.email
        },
        messages: messages.map(msg => ({
          id: msg.id,
          direction: msg.direction,
          subject: msg.subject,
          body: msg.body,
          fromName: msg.fromName,
          createdAt: msg.createdAt.toISOString()
        }))
      })
    }

    // Get all studios with their latest HQ message
    const studios = await db.studio.findMany({
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { name: "asc" }
    })

    // Get latest message and counts for each studio
    const conversations = await Promise.all(
      studios.map(async (studio) => {
        const messages = await db.hQMessage.findMany({
          where: { studioId: studio.id },
          orderBy: { createdAt: "desc" },
          take: 1
        })

        const totalMessages = await db.hQMessage.count({
          where: { studioId: studio.id }
        })

        const unreadCount = await db.hQMessage.count({
          where: {
            studioId: studio.id,
            direction: "INBOUND",
            // Could add read tracking here
          }
        })

        const lastMessage = messages[0]

        return {
          studioId: studio.id,
          studioName: studio.name,
          ownerName: `${studio.owner.firstName} ${studio.owner.lastName}`,
          ownerEmail: studio.owner.email,
          lastMessage: lastMessage ? {
            direction: lastMessage.direction,
            subject: lastMessage.subject,
            body: lastMessage.body.substring(0, 100) + (lastMessage.body.length > 100 ? "..." : ""),
            createdAt: lastMessage.createdAt.toISOString()
          } : null,
          totalMessages,
          unreadCount
        }
      })
    )

    // Sort by last message date (most recent first), studios with messages first
    conversations.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      }
      if (a.lastMessage) return -1
      if (b.lastMessage) return 1
      return a.studioName.localeCompare(b.studioName)
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Failed to fetch HQ inbox:", error)
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 })
  }
}

// POST - Send message to studio
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { studioId, subject, message } = body

    if (!studioId || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Send the email
    const result = await sendHQEmailToStudio({
      studioId,
      subject,
      body: message,
      senderId: session.user.id
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.dbMessageId 
    })
  } catch (error) {
    console.error("Failed to send HQ message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

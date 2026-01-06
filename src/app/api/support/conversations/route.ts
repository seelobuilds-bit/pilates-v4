import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List conversations for the current user
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId, teacherId, studioId } = session.user

    let conversations
    
    if (role === "HQ_ADMIN") {
      // HQ can see all conversations
      conversations = await db.supportConversation.findMany({
        orderBy: { lastMessageAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      })
    } else if (role === "TEACHER") {
      // Teacher sees their own conversations
      conversations = await db.supportConversation.findMany({
        where: { teacherId },
        orderBy: { lastMessageAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      })
    } else {
      // Studio owner sees their conversations
      conversations = await db.supportConversation.findMany({
        where: { userId },
        orderBy: { lastMessageAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      })
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

// POST - Create a new conversation
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId, teacherId, studioId } = session.user
    const { subject, message, category } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
    }

    // Determine sender info
    const senderType = role === "TEACHER" ? "teacher" : "user"
    const senderName = `${session.user.firstName} ${session.user.lastName}`

    // Create conversation with initial message
    const conversation = await db.supportConversation.create({
      data: {
        subject,
        category,
        userId: role !== "TEACHER" ? userId : undefined,
        teacherId: role === "TEACHER" ? teacherId : undefined,
        studioId: studioId || undefined,
        unreadByHQ: true,
        unreadByUser: false,
        messages: {
          create: {
            content: message,
            senderType,
            senderId: role === "TEACHER" ? teacherId! : userId,
            senderName,
            isRead: false
          }
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to create conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}














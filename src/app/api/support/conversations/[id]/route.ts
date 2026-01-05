import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - Get a single conversation with all messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { role, id: userId, teacherId } = session.user

    const conversation = await db.supportConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Check authorization
    if (role !== "HQ_ADMIN") {
      const isOwner = 
        (role === "TEACHER" && conversation.teacherId === teacherId) ||
        (role !== "TEACHER" && conversation.userId === userId)
      
      if (!isOwner) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Mark messages as read and update unread status
    if (role === "HQ_ADMIN") {
      await db.supportMessage.updateMany({
        where: {
          conversationId: id,
          senderType: { not: "hq" },
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      await db.supportConversation.update({
        where: { id },
        data: { unreadByHQ: false }
      })
    } else {
      await db.supportMessage.updateMany({
        where: {
          conversationId: id,
          senderType: "hq",
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      await db.supportConversation.update({
        where: { id },
        data: { unreadByUser: false }
      })
    }

    // Fetch updated conversation
    const updatedConversation = await db.supportConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    return NextResponse.json({ conversation: updatedConversation })
  } catch (error) {
    console.error("Failed to fetch conversation:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}

// PATCH - Update conversation status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { status, priority, assignedToId } = await request.json()

    // Only HQ can update status
    if (session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Only HQ can update conversation status" }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolvedAt = new Date()
      updateData.resolvedById = session.user.id
    }

    const conversation = await db.supportConversation.update({
      where: { id },
      data: updateData,
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })

    // Add system message for status change
    if (status) {
      await db.supportMessage.create({
        data: {
          conversationId: id,
          content: `Status changed to ${status.replace("_", " ").toLowerCase()}`,
          senderType: "hq",
          senderId: session.user.id,
          senderName: "System",
          isSystemMessage: true,
          isRead: false
        }
      })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to update conversation:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}













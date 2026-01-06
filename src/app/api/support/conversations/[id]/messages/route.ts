import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// POST - Send a new message in a conversation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params
    const { content, attachments } = await request.json()
    const { role, id: userId, teacherId } = session.user

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Verify conversation exists and user has access
    const conversation = await db.supportConversation.findUnique({
      where: { id: conversationId }
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

    // Determine sender info
    const senderType = role === "HQ_ADMIN" ? "hq" : (role === "TEACHER" ? "teacher" : "user")
    const senderName = `${session.user.firstName} ${session.user.lastName}`
    const senderId = role === "HQ_ADMIN" ? userId : (role === "TEACHER" ? teacherId! : userId)

    // Create the message
    const message = await db.supportMessage.create({
      data: {
        conversationId,
        content: content.trim(),
        senderType,
        senderId,
        senderName,
        attachments: attachments || [],
        isRead: false
      }
    })

    // Update conversation
    const updateData: Record<string, unknown> = {
      lastMessageAt: new Date()
    }

    if (role === "HQ_ADMIN") {
      updateData.unreadByUser = true
      updateData.unreadByHQ = false
      // If responding, set status to in progress
      if (conversation.status === "OPEN") {
        updateData.status = "IN_PROGRESS"
      }
    } else {
      updateData.unreadByHQ = true
      updateData.unreadByUser = false
      // If customer responds, update status
      if (conversation.status === "WAITING_CUSTOMER") {
        updateData.status = "IN_PROGRESS"
      }
    }

    await db.supportConversation.update({
      where: { id: conversationId },
      data: updateData
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}














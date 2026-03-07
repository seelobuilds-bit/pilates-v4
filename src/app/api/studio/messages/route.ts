import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loadInboxConversationSummaries } from "@/lib/inbox-conversations"
import { getSession } from "@/lib/session"
import { sendEmail, sendSMS } from "@/lib/communications"
import { sendMobilePushNotification } from "@/lib/mobile-push"

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
      const [client, messages] = await Promise.all([
        db.client.findFirst({
          where: {
            id: clientId,
            studioId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        }),
        db.message.findMany({
          where: {
            studioId,
            clientId,
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            channel: true,
            direction: true,
            status: true,
            subject: true,
            body: true,
            fromName: true,
            toName: true,
            createdAt: true,
            sentAt: true,
          },
        }),
      ])

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
      }
      
      return NextResponse.json({
        client,
        messages,
      })
    }

    // Get all conversations (grouped by client)
    const conversations = await loadInboxConversationSummaries({
      studioId,
    })

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

    const normalizedChannel = String(channel).toUpperCase()

    let result: { success: boolean; messageId?: string; error?: string }

    if (normalizedChannel === "CHAT") {
      const createdMessage = await db.message.create({
        data: {
          channel: "CHAT",
          direction: "OUTBOUND",
          status: "SENT",
          body: messageBody,
          fromAddress: `chat@${client.studioId}.thecurrent.app`,
          toAddress: client.email || client.phone || `client-${client.id}`,
          fromName: session.user.firstName ? `${session.user.firstName} ${session.user.lastName}`.trim() : "Studio Team",
          toName: `${client.firstName} ${client.lastName}`,
          threadId: `s_${studioId}_c_${client.id}`,
          sentAt: new Date(),
          studioId,
          clientId: client.id,
        },
        select: { id: true },
      })

      result = { success: true, messageId: createdMessage.id }

      try {
        await sendMobilePushNotification({
          studioId,
          clientIds: [client.id],
          category: "INBOX",
          title: `New message from ${session.user.firstName || "your studio"}`,
          body: messageBody,
          data: {
            type: "mobile_inbox_message",
            channel: "CHAT",
            studioId,
            clientId: client.id,
          },
        })
      } catch (pushError) {
        console.error("Studio chat push notify failed:", pushError)
      }
    } else if (normalizedChannel === "EMAIL") {
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
    } else if (normalizedChannel === "SMS") {
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

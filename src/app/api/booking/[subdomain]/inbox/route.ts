import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientTokenFromRequest } from "@/lib/client-auth"
import { sendMobilePushNotification } from "@/lib/mobile-push"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientTokenFromRequest(request, subdomain)
    if (!decoded || decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await db.client.findFirst({
      where: {
        id: decoded.clientId,
        studioId: studio.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const messages = await db.message.findMany({
      where: {
        studioId: studio.id,
        clientId: client.id,
      },
      orderBy: { createdAt: "asc" },
      take: 400,
    })

    return NextResponse.json({
      client,
      messages: messages.map((message) => ({
        id: message.id,
        channel: message.channel,
        direction: message.direction,
        subject: message.subject,
        body: message.body,
        fromName: message.fromName,
        toName: message.toName,
        createdAt: message.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Client web inbox load failed:", error)
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params

    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        ownerId: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientTokenFromRequest(request, subdomain)
    if (!decoded || decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const client = await db.client.findFirst({
      where: {
        id: decoded.clientId,
        studioId: studio.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const createdMessage = await db.message.create({
      data: {
        channel: "CHAT",
        direction: "INBOUND",
        status: "SENT",
        body: message,
        fromAddress: client.email || "client@web.thecurrent.app",
        toAddress: `inbox@${studio.subdomain}.thecurrent.app`,
        fromName: `${client.firstName} ${client.lastName}`,
        toName: studio.name,
        threadId: `s_${studio.id}_c_${client.id}`,
        studioId: studio.id,
        clientId: client.id,
        sentAt: new Date(),
      },
      select: { id: true },
    })

    try {
      const teachers = await db.teacher.findMany({
        where: {
          studioId: studio.id,
          isActive: true,
        },
        select: {
          userId: true,
        },
      })

      const recipientUserIds = Array.from(new Set([studio.ownerId, ...teachers.map((teacher) => teacher.userId)]))

      await sendMobilePushNotification({
        studioId: studio.id,
        userIds: recipientUserIds,
        category: "INBOX",
        title: `New message from ${client.firstName} ${client.lastName}`,
        body: message,
        data: {
          type: "mobile_inbox_message",
          channel: "CHAT",
          clientId: client.id,
          studioId: studio.id,
        },
      })
    } catch (pushError) {
      console.error("Client web inbox push notify failed:", pushError)
    }

    return NextResponse.json({ success: true, messageId: createdMessage.id })
  } catch (error) {
    console.error("Client web inbox send failed:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail, sendSMS } from "@/lib/communications"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { sendMobilePushNotification } from "@/lib/mobile-push"

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        ownerId: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const clientIdFromBody = String(body?.clientId || "").trim()
    const requestedChannel = String(body?.channel || "").trim().toUpperCase()
    const message = String(body?.message || "").trim()
    const subject = String(body?.subject || "").trim()

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    if (decoded.role === "CLIENT") {
      const clientId = decoded.clientId || decoded.sub
      const client = await db.client.findFirst({
        where: {
          id: clientId,
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

      const inboundMessage = await db.message.create({
        data: {
          channel: "CHAT",
          direction: "INBOUND",
          status: "SENT",
          subject: null,
          body: message,
          fromAddress: client.email || "client@mobile.thecurrent.app",
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
        console.error("Mobile inbox push notify (studio recipients) failed:", pushError)
      }

      return NextResponse.json({ success: true, messageId: inboundMessage.id })
    }

    const clientId = clientIdFromBody
    const channel = requestedChannel || "CHAT"

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 })
    }

    if (decoded.role === "TEACHER") {
      if (!decoded.teacherId) {
        return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
      }

      const hasBooking = await db.booking.findFirst({
        where: {
          studioId: studio.id,
          clientId,
          classSession: {
            teacherId: decoded.teacherId,
          },
        },
        select: { id: true },
      })

      if (!hasBooking) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    const client = await db.client.findFirst({
      where: {
        id: clientId,
        studioId: studio.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (!["CHAT", "EMAIL", "SMS"].includes(channel)) {
      return NextResponse.json({ error: "channel must be CHAT, EMAIL, or SMS" }, { status: 400 })
    }

    if (channel === "CHAT") {
      const createdMessage = await db.message.create({
        data: {
          channel: "CHAT",
          direction: "OUTBOUND",
          status: "SENT",
          body: message,
          fromAddress: `chat@${studio.subdomain}.thecurrent.app`,
          toAddress: client.email || client.phone || `client-${client.id}`,
          fromName: decoded.role === "TEACHER" ? "Your teacher" : studio.name,
          toName: `${client.firstName} ${client.lastName}`,
          threadId: `s_${studio.id}_c_${client.id}`,
          studioId: studio.id,
          clientId: client.id,
          sentAt: new Date(),
        },
        select: { id: true },
      })

      try {
        await sendMobilePushNotification({
          studioId: studio.id,
          clientIds: [client.id],
          category: "INBOX",
          title: `Message from ${decoded.role === "TEACHER" ? "your teacher" : studio.name}`,
          body: message,
          data: {
            type: "mobile_inbox_message",
            channel: "CHAT",
            studioId: studio.id,
            clientId: client.id,
          },
        })
      } catch (pushError) {
        console.error("Mobile inbox push notify (client recipient) failed:", pushError)
      }

      return NextResponse.json({ success: true, messageId: createdMessage.id })
    }

    if (channel === "EMAIL") {
      if (!client.email) {
        return NextResponse.json({ error: "Client has no email address" }, { status: 400 })
      }

      const result = await sendEmail(studio.id, {
        to: client.email,
        toName: `${client.firstName} ${client.lastName}`,
        subject: subject || "Message from your studio",
        body: message,
        clientId: client.id,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
      }

      try {
        await sendMobilePushNotification({
          studioId: studio.id,
          clientIds: [client.id],
          category: "INBOX",
          title: `Message from ${studio.name}`,
          body: message,
          data: {
            type: "mobile_inbox_message",
            channel: "EMAIL",
            studioId: studio.id,
            clientId: client.id,
          },
        })
      } catch (pushError) {
        console.error("Mobile inbox push notify (client recipient) failed:", pushError)
      }

      return NextResponse.json({ success: true, messageId: result.messageId })
    }

    if (!client.phone) {
      return NextResponse.json({ error: "Client has no phone number" }, { status: 400 })
    }

    const result = await sendSMS(studio.id, {
      to: client.phone,
      toName: `${client.firstName} ${client.lastName}`,
      body: message,
      clientId: client.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send SMS" }, { status: 500 })
    }

    try {
      await sendMobilePushNotification({
        studioId: studio.id,
        clientIds: [client.id],
        category: "INBOX",
        title: `Message from ${studio.name}`,
        body: message,
        data: {
          type: "mobile_inbox_message",
          channel: "SMS",
          studioId: studio.id,
          clientId: client.id,
        },
      })
    } catch (pushError) {
      console.error("Mobile inbox push notify (client recipient) failed:", pushError)
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Mobile inbox send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

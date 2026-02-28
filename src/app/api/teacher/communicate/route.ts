import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendEmail, sendSMS } from "@/lib/communications"
import { sendMobilePushNotification } from "@/lib/mobile-push"

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teacherId = session.user.teacherId
    const data = await request.json()
    const { type, clientId, subject, message } = data

    if (!type || !clientId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

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
      return NextResponse.json({ 
        error: "You can only contact clients who have booked your classes" 
      }, { status: 403 })
    }

    // Get client details
    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        studio: {
          include: {
            emailConfig: true,
            smsConfig: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get teacher name
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    })

    const teacherName = teacher?.user ? `${teacher.user.firstName} ${teacher.user.lastName}` : "Your Teacher"

    const normalizedType = String(type).toLowerCase()

    if (normalizedType === "chat") {
      const createdMessage = await db.message.create({
        data: {
          channel: "CHAT",
          direction: "OUTBOUND",
          status: "SENT",
          body: message,
          fromAddress: `chat@${client.studioId}.thecurrent.app`,
          toAddress: client.email || client.phone || `client-${client.id}`,
          fromName: teacherName,
          toName: `${client.firstName} ${client.lastName}`,
          threadId: `s_${client.studioId}_c_${client.id}`,
          sentAt: new Date(),
          studioId: client.studioId,
          clientId: client.id,
        },
        select: { id: true },
      })

      try {
        await sendMobilePushNotification({
          studioId: client.studioId,
          clientIds: [client.id],
          category: "INBOX",
          title: `New message from ${teacherName}`,
          body: message,
          data: {
            type: "mobile_inbox_message",
            channel: "CHAT",
            studioId: client.studioId,
            clientId: client.id,
          },
        })
      } catch (pushError) {
        console.error("Teacher chat push notify failed:", pushError)
      }

      return NextResponse.json({ success: true, message: "Chat message sent", messageId: createdMessage.id })
    }

    if (normalizedType === "email") {
      const emailConfig = client.studio.emailConfig

      if (!emailConfig) {
        return NextResponse.json({ error: "Email not configured for this studio" }, { status: 400 })
      }

      const result = await sendEmail(client.studioId, {
        to: client.email,
        toName: `${client.firstName} ${client.lastName}`,
        subject: subject || "Message from your instructor",
        body: `Hi ${client.firstName},\n\n${message}\n\nBest,\n${teacherName}`,
        clientId: client.id,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send email" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: "Email sent successfully" })

    } else if (normalizedType === "sms") {
      if (!client.phone) {
        return NextResponse.json({ error: "Client has no phone number" }, { status: 400 })
      }

      const smsConfig = client.studio.smsConfig

      if (!smsConfig) {
        return NextResponse.json({ error: "SMS not configured for this studio" }, { status: 400 })
      }

      const result = await sendSMS(client.studioId, {
        to: client.phone,
        toName: `${client.firstName} ${client.lastName}`,
        body: `${message}\n\n- ${teacherName}, ${client.studio.name}`,
        from: smsConfig.fromNumber,
        clientId: client.id,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send SMS" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: "SMS sent successfully" })

    } else {
      return NextResponse.json({ error: "Invalid communication type" }, { status: 400 })
    }

  } catch (error) {
    console.error("Failed to send communication:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}












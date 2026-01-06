import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import nodemailer from "nodemailer"
import twilio from "twilio"

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

    if (type === "email") {
      // Send email
      const emailConfig = client.studio.emailConfig

      if (!emailConfig) {
        return NextResponse.json({ error: "Email not configured for this studio" }, { status: 400 })
      }

      const transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpPort === 465,
        auth: {
          user: emailConfig.smtpUser,
          pass: emailConfig.smtpPassword
        }
      })

      await transporter.sendMail({
        from: `"${teacherName} via ${client.studio.name}" <${emailConfig.fromEmail}>`,
        to: client.email,
        subject: subject || "Message from your instructor",
        text: message,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi ${client.firstName},</p>
            <div style="white-space: pre-wrap;">${message}</div>
            <p style="margin-top: 24px;">Best,<br/>${teacherName}</p>
            <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
            <p style="color: #888; font-size: 12px;">
              Sent from ${client.studio.name}
            </p>
          </div>
        `
      })

      // Log the communication
      await db.message.create({
        data: {
          channel: "EMAIL",
          direction: "OUTBOUND",
          status: "SENT",
          subject: subject || "Message from instructor",
          body: message,
          fromAddress: emailConfig.fromEmail,
          toAddress: client.email,
          fromName: teacherName,
          toName: `${client.firstName} ${client.lastName}`,
          sentAt: new Date(),
          studioId: client.studioId,
          clientId: client.id
        }
      })

      return NextResponse.json({ success: true, message: "Email sent successfully" })

    } else if (type === "sms") {
      // Send SMS
      if (!client.phone) {
        return NextResponse.json({ error: "Client has no phone number" }, { status: 400 })
      }

      const smsConfig = client.studio.smsConfig

      if (!smsConfig) {
        return NextResponse.json({ error: "SMS not configured for this studio" }, { status: 400 })
      }

      const twilioClient = twilio(smsConfig.twilioAccountSid, smsConfig.twilioAuthToken)

      await twilioClient.messages.create({
        body: `${message}\n\n- ${teacherName}, ${client.studio.name}`,
        from: smsConfig.twilioPhoneNumber,
        to: client.phone
      })

      // Log the communication
      await db.message.create({
        data: {
          channel: "SMS",
          direction: "OUTBOUND",
          status: "SENT",
          body: message,
          fromAddress: smsConfig.twilioPhoneNumber,
          toAddress: client.phone,
          fromName: teacherName,
          toName: `${client.firstName} ${client.lastName}`,
          sentAt: new Date(),
          studioId: client.studioId,
          clientId: client.id
        }
      })

      return NextResponse.json({ success: true, message: "SMS sent successfully" })

    } else {
      return NextResponse.json({ error: "Invalid communication type" }, { status: 400 })
    }

  } catch (error) {
    console.error("Failed to send communication:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}













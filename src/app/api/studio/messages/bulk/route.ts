import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { clientIds, channel, subject, message, classId } = await request.json()

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: "No recipients specified" }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get studio settings for email/SMS config
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Get all clients
    const clients = await db.client.findMany({
      where: {
        id: { in: clientIds },
        studioId: session.user.studioId
      }
    })

    if (clients.length === 0) {
      return NextResponse.json({ error: "No valid clients found" }, { status: 400 })
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Get sender name
    const senderName = session.user.firstName && session.user.lastName 
      ? `${session.user.firstName} ${session.user.lastName}`
      : studio.name

    if (channel === "EMAIL") {
      // Get email config from studio settings
      const emailConfig = studio.settings as { email?: { smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string; fromEmail?: string; fromName?: string } } | null
      
      if (!emailConfig?.email?.smtpHost || !emailConfig?.email?.smtpUser) {
        return NextResponse.json({ error: "Email not configured for this studio" }, { status: 400 })
      }

      const transporter = nodemailer.createTransport({
        host: emailConfig.email.smtpHost,
        port: emailConfig.email.smtpPort || 587,
        secure: (emailConfig.email.smtpPort || 587) === 465,
        auth: {
          user: emailConfig.email.smtpUser,
          pass: emailConfig.email.smtpPassword
        }
      })

      for (const client of clients) {
        try {
          await transporter.sendMail({
            from: `"${emailConfig.email.fromName || studio.name}" <${emailConfig.email.fromEmail || emailConfig.email.smtpUser}>`,
            to: client.email,
            subject: subject || "Message from your studio",
            text: message,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">${studio.name}</p>
            </div>`
          })

          // Log message
          await db.message.create({
            data: {
              channel: "EMAIL",
              direction: "OUTBOUND",
              status: "SENT",
              subject,
              body: message,
              fromAddress: emailConfig.email.fromEmail || emailConfig.email.smtpUser,
              toAddress: client.email,
              fromName: senderName,
              toName: `${client.firstName} ${client.lastName}`,
              sentAt: new Date(),
              studioId: session.user.studioId,
              clientId: client.id
            }
          })

          results.sent++
        } catch (error) {
          console.error(`Failed to send email to ${client.email}:`, error)
          results.failed++
          results.errors.push(`Failed to send to ${client.firstName} ${client.lastName}`)
        }
      }
    } else if (channel === "SMS") {
      // Get SMS config
      const smsConfig = studio.settings as { sms?: { twilioAccountSid?: string; twilioAuthToken?: string; twilioPhoneNumber?: string } } | null
      
      if (!smsConfig?.sms?.twilioAccountSid || !smsConfig?.sms?.twilioPhoneNumber) {
        return NextResponse.json({ error: "SMS not configured for this studio" }, { status: 400 })
      }

      const twilio = require('twilio')(smsConfig.sms.twilioAccountSid, smsConfig.sms.twilioAuthToken)

      for (const client of clients) {
        if (!client.phone) {
          results.failed++
          results.errors.push(`${client.firstName} ${client.lastName} has no phone number`)
          continue
        }

        try {
          await twilio.messages.create({
            body: message,
            from: smsConfig.sms.twilioPhoneNumber,
            to: client.phone
          })

          // Log message
          await db.message.create({
            data: {
              channel: "SMS",
              direction: "OUTBOUND",
              status: "SENT",
              body: message,
              fromAddress: smsConfig.sms.twilioPhoneNumber,
              toAddress: client.phone,
              fromName: senderName,
              toName: `${client.firstName} ${client.lastName}`,
              sentAt: new Date(),
              studioId: session.user.studioId,
              clientId: client.id
            }
          })

          results.sent++
        } catch (error) {
          console.error(`Failed to send SMS to ${client.phone}:`, error)
          results.failed++
          results.errors.push(`Failed to send to ${client.firstName} ${client.lastName}`)
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    })
  } catch (error) {
    console.error("Bulk message error:", error)
    return NextResponse.json({ error: "Failed to send messages" }, { status: 500 })
  }
}













import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendEmail, sendSMS } from "@/lib/communications"

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { clientIds, channel, subject, message } = await request.json()

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: "No recipients specified" }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get studio settings for email/SMS config
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      include: {
        emailConfig: true,
        smsConfig: true,
      },
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

    if (channel === "EMAIL") {
      if (!studio.emailConfig) {
        return NextResponse.json({ error: "Email not configured for this studio" }, { status: 400 })
      }

      for (const client of clients) {
        try {
          const result = await sendEmail(session.user.studioId, {
            to: client.email,
            toName: `${client.firstName} ${client.lastName}`,
            subject: subject || "Message from your studio",
            body: message,
            clientId: client.id,
          })

          if (result.success) {
            results.sent++
          } else {
            results.failed++
            results.errors.push(
              `Failed to send to ${client.firstName} ${client.lastName}: ${result.error || "Unknown error"}`
            )
          }
        } catch (error) {
          console.error(`Failed to send email to ${client.email}:`, error)
          results.failed++
          results.errors.push(`Failed to send to ${client.firstName} ${client.lastName}`)
        }
      }
    } else if (channel === "SMS") {
      if (!studio.smsConfig?.fromNumber) {
        return NextResponse.json({ error: "SMS not configured for this studio" }, { status: 400 })
      }

      for (const client of clients) {
        if (!client.phone) {
          results.failed++
          results.errors.push(`${client.firstName} ${client.lastName} has no phone number`)
          continue
        }

        try {
          const result = await sendSMS(session.user.studioId, {
            to: client.phone,
            toName: `${client.firstName} ${client.lastName}`,
            body: message,
            from: studio.smsConfig.fromNumber,
            clientId: client.id,
          })

          if (result.success) {
            results.sent++
          } else {
            results.failed++
            results.errors.push(
              `Failed to send to ${client.firstName} ${client.lastName}: ${result.error || "Unknown error"}`
            )
          }
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












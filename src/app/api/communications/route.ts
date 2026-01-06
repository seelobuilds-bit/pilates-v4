import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { sendSMS, sendEmail, initiateCall, getServiceStatus } from "@/lib/communications"
import { ActivityType } from "@prisma/client"

// GET - Check service status
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || !["HQ_ADMIN", "SALES_AGENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const status = getServiceStatus()
    return NextResponse.json({ status })
  } catch (error) {
    console.error("Failed to get service status:", error)
    return NextResponse.json({ error: "Failed to get service status" }, { status: 500 })
  }
}

// POST - Send communication (email, SMS, or call)
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || !["HQ_ADMIN", "SALES_AGENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { type, leadId, to, from, subject, content, recordCall } = data

    if (!type || !to) {
      return NextResponse.json({ error: "Type and recipient required" }, { status: 400 })
    }

    // Get agent
    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    let result
    let activityType: ActivityType

    switch (type) {
      case "email":
        if (!subject || !content) {
          return NextResponse.json({ error: "Subject and content required for email" }, { status: 400 })
        }
        result = await sendEmail({
          to,
          subject,
          body: content,
          from: from || undefined,
          replyTo: session.user.email || undefined,
        })
        activityType = ActivityType.EMAIL
        break

      case "sms":
        if (!content) {
          return NextResponse.json({ error: "Message content required for SMS" }, { status: 400 })
        }
        result = await sendSMS({
          to,
          from: from || undefined,
          message: content,
        })
        activityType = ActivityType.SMS
        break

      case "call":
        result = await initiateCall({
          to,
          from: from || undefined,
          recordCall: recordCall ?? true,
        })
        activityType = ActivityType.CALL
        break

      default:
        return NextResponse.json({ error: "Invalid communication type" }, { status: 400 })
    }

    // Log activity to lead if leadId provided
    if (leadId && agent) {
      await db.leadActivity.create({
        data: {
          leadId,
          type: activityType,
          subject: subject || `${type.toUpperCase()} to ${to}`,
          content: content || (type === "call" ? `Call initiated to ${to}` : undefined),
          direction: "outbound",
          toAddress: to,
          outcome: result.success ? "sent" : "failed",
          agentId: agent.id,
        }
      })

      // Update lead stats
      const updateData: Record<string, unknown> = {
        lastContactedAt: new Date()
      }

      if (type === "call") {
        updateData.totalCalls = { increment: 1 }
      } else if (type === "email") {
        updateData.totalEmails = { increment: 1 }
      } else if (type === "sms") {
        updateData.totalSms = { increment: 1 }
      }

      await db.lead.update({
        where: { id: leadId },
        data: updateData
      })
    }

    const serviceKey = type === "call" ? "voice" : type as "sms" | "email"
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to send", 
        simulated: !getServiceStatus()[serviceKey]
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: (result as { messageId?: string; callSid?: string }).messageId || (result as { callSid?: string }).callSid,
      simulated: !getServiceStatus()[serviceKey]
    })
  } catch (error) {
    console.error("Failed to send communication:", error)
    return NextResponse.json({ error: "Failed to send communication" }, { status: 500 })
  }
}













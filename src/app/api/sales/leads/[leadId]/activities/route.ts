import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// POST - Log an activity (call, email, SMS, note)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params
    const data = await request.json()

    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Verify lead ownership
    const lead = await db.lead.findFirst({
      where: { id: leadId, assignedToId: agent.id }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found or not assigned to you" }, { status: 404 })
    }

    // Create activity
    const activity = await db.leadActivity.create({
      data: {
        leadId,
        type: data.type,
        subject: data.subject,
        content: data.content,
        direction: data.direction || "outbound",
        duration: data.duration,
        outcome: data.outcome,
        toAddress: data.toAddress || lead.contactEmail,
        fromAddress: data.fromAddress,
        agentId: agent.id
      },
      include: {
        agent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    // Update lead contact stats
    const updateData: Record<string, unknown> = {
      lastContactedAt: new Date()
    }

    if (data.type === "CALL") {
      updateData.totalCalls = { increment: 1 }
    } else if (data.type === "EMAIL") {
      updateData.totalEmails = { increment: 1 }
    } else if (data.type === "SMS") {
      updateData.totalSms = { increment: 1 }
    }

    await db.lead.update({
      where: { id: leadId },
      data: updateData
    })

    // If actual sending is requested, send the email/SMS
    if (data.sendActual && (data.type === "EMAIL" || data.type === "SMS")) {
      // For now, we'll just return success - actual sending would integrate with email/SMS providers
      // In production, you'd call your email service (SendGrid, etc.) or SMS service (Twilio, etc.) here
      console.log(`Would send ${data.type} to ${lead.contactEmail}`)
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Failed to log activity:", error)
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 })
  }
}













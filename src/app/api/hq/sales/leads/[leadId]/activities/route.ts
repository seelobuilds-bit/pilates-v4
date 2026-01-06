import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - Get activities for a lead
export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params

    const activities = await db.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

// POST - Create a new activity (call, email, SMS, note)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params
    const data = await request.json()

    // Get sales agent for current user
    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    const activity = await db.leadActivity.create({
      data: {
        leadId,
        type: data.type,
        subject: data.subject,
        content: data.content,
        direction: data.direction || "outbound",
        duration: data.duration,
        outcome: data.outcome,
        toAddress: data.toAddress,
        fromAddress: data.fromAddress,
        agentId: agent?.id
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

    // Update lead with last contacted and communication counts
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

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Failed to create activity:", error)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}













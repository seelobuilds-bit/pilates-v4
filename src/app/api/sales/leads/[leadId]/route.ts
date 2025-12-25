import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - Get single lead (only if assigned to agent)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params

    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const lead = await db.lead.findFirst({
      where: { 
        id: leadId,
        assignedToId: agent.id // Only if assigned to this agent
      },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
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
        },
        tasks: {
          orderBy: { dueDate: "asc" },
          include: {
            assignedTo: {
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
        },
        demoBookings: {
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found or not assigned to you" }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("Failed to fetch lead:", error)
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

// PATCH - Update lead
export async function PATCH(
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

    // Verify ownership
    const currentLead = await db.lead.findFirst({
      where: { id: leadId, assignedToId: agent.id }
    })

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found or not assigned to you" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // Handle status change
    if (data.status && data.status !== currentLead.status) {
      updateData.status = data.status
      
      await db.leadActivity.create({
        data: {
          leadId,
          type: "STATUS_CHANGE",
          content: `Status changed from ${currentLead.status} to ${data.status}`,
          previousStatus: currentLead.status,
          newStatus: data.status,
          agentId: agent.id
        }
      })

      if (data.status === "WON") {
        updateData.wonDate = new Date()
        await db.salesAgent.update({
          where: { id: agent.id },
          data: { 
            totalWon: { increment: 1 },
            totalRevenue: { increment: data.actualValue || currentLead.estimatedValue || 0 }
          }
        })
      } else if (data.status === "LOST") {
        updateData.lostReason = data.lostReason
        await db.salesAgent.update({
          where: { id: agent.id },
          data: { totalLost: { increment: 1 } }
        })
      }
    }

    // Update other allowed fields
    const allowedFields = [
      'contactPhone', 'painPoints', 'notes', 'estimatedValue', 
      'probability', 'expectedClose', 'nextFollowUpAt', 'priority',
      'studioSize', 'currentSoftware'
    ]

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'expectedClose' || field === 'nextFollowUpAt') {
          updateData[field] = data[field] ? new Date(data[field]) : null
        } else {
          updateData[field] = data[field]
        }
      }
    }

    const lead = await db.lead.update({
      where: { id: leadId },
      data: updateData
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("Failed to update lead:", error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

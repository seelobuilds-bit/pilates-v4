import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - Get single lead with all details
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

    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
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
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
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
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params
    const data = await request.json()

    // Get current lead for comparison
    const currentLead = await db.lead.findUnique({
      where: { id: leadId }
    })

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Get sales agent for current user
    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    const updateData: Record<string, unknown> = {}

    // Handle status change
    if (data.status && data.status !== currentLead.status) {
      updateData.status = data.status
      
      // Create status change activity
      await db.leadActivity.create({
        data: {
          leadId,
          type: "STATUS_CHANGE",
          content: `Status changed from ${currentLead.status} to ${data.status}`,
          previousStatus: currentLead.status,
          newStatus: data.status,
          agentId: agent?.id
        }
      })

      // Handle won/lost
      if (data.status === "WON") {
        updateData.wonDate = new Date()
        if (agent) {
          await db.salesAgent.update({
            where: { id: agent.id },
            data: { 
              totalWon: { increment: 1 },
              totalRevenue: { increment: data.actualValue || currentLead.estimatedValue || 0 }
            }
          })
        }
      } else if (data.status === "LOST") {
        updateData.lostReason = data.lostReason
        if (agent) {
          await db.salesAgent.update({
            where: { id: agent.id },
            data: { totalLost: { increment: 1 } }
          })
        }
      }
    }

    // Handle assignment change
    if (data.assignedToId !== undefined && data.assignedToId !== currentLead.assignedToId) {
      updateData.assignedToId = data.assignedToId || null
      updateData.assignedAt = data.assignedToId ? new Date() : null
      
      // Update agent lead counts
      if (currentLead.assignedToId) {
        await db.salesAgent.update({
          where: { id: currentLead.assignedToId },
          data: { totalLeads: { decrement: 1 } }
        })
      }
      if (data.assignedToId) {
        await db.salesAgent.update({
          where: { id: data.assignedToId },
          data: { totalLeads: { increment: 1 } }
        })
      }
    }

    // Update other fields
    const allowedFields = [
      'studioName', 'website', 'contactName', 'contactEmail', 'contactPhone',
      'contactRole', 'city', 'state', 'country', 'timezone', 'priority',
      'currentSoftware', 'studioSize', 'monthlyRevenue', 'painPoints', 'notes',
      'estimatedValue', 'probability', 'expectedClose', 'tags', 'nextFollowUpAt',
      'actualValue', 'lostReason'
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
      data: updateData,
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("Failed to update lead:", error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

// DELETE - Delete lead
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params

    const lead = await db.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Update agent count
    if (lead.assignedToId) {
      await db.salesAgent.update({
        where: { id: lead.assignedToId },
        data: { totalLeads: { decrement: 1 } }
      })
    }

    await db.lead.delete({
      where: { id: leadId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete lead:", error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}













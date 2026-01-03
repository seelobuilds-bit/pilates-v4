import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List demos for the current sales agent (assigned + unassigned)
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ demos: [], unassignedDemos: [] })
    }

    // Get demos assigned to this agent
    const assignedDemos = await db.demoBooking.findMany({
      where: { assignedToId: agent.id },
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: {
            id: true,
            studioName: true,
            status: true
          }
        }
      }
    })

    // Get unassigned demos (available to claim)
    const unassignedDemos = await db.demoBooking.findMany({
      where: { 
        assignedToId: null,
        status: "pending"
      },
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: {
            id: true,
            studioName: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({ 
      demos: assignedDemos,
      unassignedDemos 
    })
  } catch (error) {
    console.error("Failed to fetch demos:", error)
    return NextResponse.json({ error: "Failed to fetch demos" }, { status: 500 })
  }
}

// PATCH - Update demo (schedule, complete, claim, etc.)
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    if (!data.demoId) {
      return NextResponse.json({ error: "Demo ID required" }, { status: 400 })
    }

    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Check if this is a claim action (claiming an unassigned demo)
    if (data.action === "claim") {
      const unassignedDemo = await db.demoBooking.findFirst({
        where: { id: data.demoId, assignedToId: null }
      })

      if (!unassignedDemo) {
        return NextResponse.json({ error: "Demo not found or already assigned" }, { status: 404 })
      }

      const claimedDemo = await db.demoBooking.update({
        where: { id: data.demoId },
        data: { assignedToId: agent.id }
      })

      // Also assign the associated lead if it exists and is unassigned
      if (unassignedDemo.leadId) {
        const lead = await db.lead.findUnique({ where: { id: unassignedDemo.leadId } })
        if (lead && !lead.assignedToId) {
          await db.lead.update({
            where: { id: unassignedDemo.leadId },
            data: { assignedToId: agent.id, assignedAt: new Date() }
          })
        }
      }

      return NextResponse.json({ demo: claimedDemo, message: "Demo claimed successfully" })
    }

    // Regular update - verify ownership
    const demo = await db.demoBooking.findFirst({
      where: { id: data.demoId, assignedToId: agent.id }
    })

    if (!demo) {
      return NextResponse.json({ error: "Demo not found or not assigned to you" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status) updateData.status = data.status
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate)
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.outcome !== undefined) updateData.outcome = data.outcome

    const updatedDemo = await db.demoBooking.update({
      where: { id: data.demoId },
      data: updateData
    })

    // Update lead status if scheduling
    if (data.scheduledDate && demo.leadId) {
      await db.lead.update({
        where: { id: demo.leadId },
        data: { status: "DEMO_SCHEDULED" }
      })
    }

    // Update lead status if completing
    if (data.status === "completed" && demo.leadId) {
      await db.lead.update({
        where: { id: demo.leadId },
        data: { status: "DEMO_COMPLETED" }
      })
    }

    return NextResponse.json({ demo: updatedDemo })
  } catch (error) {
    console.error("Failed to update demo:", error)
    return NextResponse.json({ error: "Failed to update demo" }, { status: 500 })
  }
}










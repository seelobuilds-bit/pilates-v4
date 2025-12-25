import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List demos assigned to the current sales agent
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
      return NextResponse.json({ demos: [] })
    }

    const demos = await db.demoBooking.findMany({
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

    return NextResponse.json({ demos })
  } catch (error) {
    console.error("Failed to fetch demos:", error)
    return NextResponse.json({ error: "Failed to fetch demos" }, { status: 500 })
  }
}

// PATCH - Update demo (schedule, complete, etc.)
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

    // Verify ownership
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

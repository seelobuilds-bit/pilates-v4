import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List all demo bookings
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedToId = searchParams.get("assignedToId")

    const where: Record<string, unknown> = {}

    if (status && status !== "all") {
      where.status = status
    }
    if (assignedToId && assignedToId !== "all") {
      where.assignedToId = assignedToId === "unassigned" ? null : assignedToId
    }

    const demos = await db.demoBooking.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
        },
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

// PATCH - Update demo booking
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    if (!data.demoId) {
      return NextResponse.json({ error: "Demo ID required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status) updateData.status = data.status
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate)
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId || null
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.outcome !== undefined) updateData.outcome = data.outcome

    const demo = await db.demoBooking.update({
      where: { id: data.demoId },
      data: updateData,
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
        },
        lead: true
      }
    })

    // If assigning demo to an agent, also assign the associated lead
    if (data.assignedToId && demo.leadId) {
      await db.lead.update({
        where: { id: demo.leadId },
        data: { 
          assignedToId: data.assignedToId,
          assignedAt: new Date(),
          status: "DEMO_REQUESTED" // Move to demo requested stage
        }
      })
    }

    // Update lead status if scheduling demo
    if (data.scheduledDate && demo.leadId) {
      await db.lead.update({
        where: { id: demo.leadId },
        data: { status: "DEMO_SCHEDULED" }
      })
    }

    // Create calendar event if scheduling
    if (data.scheduledDate && data.createCalendarEvent) {
      const agent = await db.salesAgent.findUnique({
        where: { userId: session.user.id }
      })

      if (agent) {
        await db.salesCalendarEvent.create({
          data: {
            agentId: data.assignedToId || agent.id,
            title: `Demo: ${demo.studioName}`,
            description: `Demo call with ${demo.contactName} from ${demo.studioName}`,
            startTime: new Date(data.scheduledDate),
            endTime: new Date(new Date(data.scheduledDate).getTime() + (demo.duration * 60 * 1000)),
            type: "demo",
            leadId: demo.leadId || undefined,
            demoBookingId: demo.id,
            meetingLink: data.meetingLink
          }
        })
      }
    }

    return NextResponse.json({ demo })
  } catch (error) {
    console.error("Failed to update demo:", error)
    return NextResponse.json({ error: "Failed to update demo" }, { status: 500 })
  }
}

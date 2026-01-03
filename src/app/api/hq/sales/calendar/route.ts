import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - Get calendar events
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Get agent for current user if not specified
    let targetAgentId: string | null | undefined = agentId
    if (!targetAgentId) {
      const agent = await db.salesAgent.findUnique({
        where: { userId: session.user.id }
      })
      targetAgentId = agent?.id
    }

    const where: Record<string, unknown> = {}
    
    if (targetAgentId && targetAgentId !== "all") {
      where.agentId = targetAgentId
    }
    
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const events = await db.salesCalendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
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

    // Also get leads for the events
    const leadIds = events.filter(e => e.leadId).map(e => e.leadId as string)
    const leads = leadIds.length > 0 ? await db.lead.findMany({
      where: { id: { in: leadIds } },
      select: {
        id: true,
        studioName: true,
        contactName: true
      }
    }) : []

    const leadsMap = new Map(leads.map(l => [l.id, l]))

    const eventsWithLeads = events.map(event => ({
      ...event,
      lead: event.leadId ? leadsMap.get(event.leadId) : null
    }))

    return NextResponse.json({ events: eventsWithLeads })
  } catch (error) {
    console.error("Failed to fetch calendar events:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}

// POST - Create calendar event
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Get agent for current user
    let agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    // Create agent if doesn't exist
    if (!agent) {
      agent = await db.salesAgent.create({
        data: {
          userId: session.user.id,
          title: "Sales Agent"
        }
      })
    }

    const event = await db.salesCalendarEvent.create({
      data: {
        agentId: data.agentId || agent.id,
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        allDay: data.allDay || false,
        type: data.type || "meeting",
        leadId: data.leadId,
        demoBookingId: data.demoBookingId,
        location: data.location,
        meetingLink: data.meetingLink,
        reminderMinutes: data.reminderMinutes
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

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Failed to create calendar event:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}

// PATCH - Update calendar event
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    if (!data.eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.startTime) updateData.startTime = new Date(data.startTime)
    if (data.endTime) updateData.endTime = new Date(data.endTime)
    if (data.type) updateData.type = data.type
    if (data.location !== undefined) updateData.location = data.location
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink
    if (data.status) updateData.status = data.status

    const event = await db.salesCalendarEvent.update({
      where: { id: data.eventId },
      data: updateData,
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

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Failed to update calendar event:", error)
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 })
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    await db.salesCalendarEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete calendar event:", error)
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 })
  }
}










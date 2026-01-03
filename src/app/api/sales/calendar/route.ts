import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List calendar events for the current sales agent
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      // Create agent profile if doesn't exist
      agent = await db.salesAgent.create({
        data: {
          userId: session.user.id,
          title: "Sales Agent"
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    const where: Record<string, unknown> = {
      agentId: agent.id
    }

    if (start && end) {
      where.startTime = {
        gte: new Date(start),
        lte: new Date(end)
      }
    }

    const events = await db.salesCalendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        lead: {
          select: {
            id: true,
            studioName: true,
            contactName: true
          }
        }
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Failed to fetch calendar:", error)
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 })
  }
}

// POST - Create a calendar event
export async function POST(request: Request) {
  try {
    const session = await getSession()
    console.log("Calendar POST - session:", session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      console.log("Calendar POST - Unauthorized, role is:", session?.user?.role)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      console.log("Calendar POST - Creating new agent for user:", session.user.id)
      agent = await db.salesAgent.create({
        data: {
          userId: session.user.id,
          title: "Sales Agent"
        }
      })
    }

    const data = await request.json()
    console.log("Calendar POST - Creating event with data:", JSON.stringify(data))

    const event = await db.salesCalendarEvent.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.eventType?.toLowerCase() || "call",
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : new Date(data.startTime),
        leadId: data.leadId || null,
        agentId: agent.id
      },
      include: {
        lead: {
          select: {
            id: true,
            studioName: true,
            contactName: true
          }
        }
      }
    })

    console.log("Calendar POST - Event created:", event.id)
    return NextResponse.json({ event })
  } catch (error) {
    console.error("Failed to create event:", error)
    return NextResponse.json({ error: "Failed to create event", details: String(error) }, { status: 500 })
  }
}

// DELETE - Delete a calendar event
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    // Verify ownership
    const event = await db.salesCalendarEvent.findFirst({
      where: { id: eventId, agentId: agent.id }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await db.salesCalendarEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}










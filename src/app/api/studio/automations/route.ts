import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all automations for the studio
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId

    const automations = await db.automation.findMany({
      where: { studioId },
      orderBy: { createdAt: "desc" },
      include: {
        location: {
          select: { id: true, name: true },
        },
        template: {
          select: { id: true, name: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json({ automations })
  } catch (error) {
    console.error("Error fetching automations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new automation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const body = await request.json()
    const { 
      name, 
      trigger,
      channel, 
      subject, 
      body: messageBody, 
      htmlBody,
      triggerDelay,
      triggerDays,
      reminderHours,
      locationId,
      templateId,
    } = body

    if (!name || !trigger || !channel || !messageBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const automation = await db.automation.create({
      data: {
        studioId,
        name,
        trigger,
        channel,
        subject,
        body: messageBody,
        htmlBody,
        triggerDelay: triggerDelay || 0,
        triggerDays,
        reminderHours,
        locationId,
        templateId,
        status: "DRAFT",
      },
      include: {
        location: true,
        template: true,
      },
    })

    return NextResponse.json({ automation })
  } catch (error) {
    console.error("Error creating automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

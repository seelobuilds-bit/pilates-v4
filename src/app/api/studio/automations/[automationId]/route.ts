import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch a specific automation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { automationId } = await params

    const automation = await db.automation.findFirst({
      where: { id: automationId, studioId },
      include: {
        location: true,
        template: true,
        messages: {
          take: 100,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 })
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error("Error fetching automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update an automation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { automationId } = await params
    const body = await request.json()

    const existingAutomation = await db.automation.findFirst({
      where: { id: automationId, studioId },
    })

    if (!existingAutomation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 })
    }

    const automation = await db.automation.update({
      where: { id: automationId },
      data: {
        name: body.name,
        trigger: body.trigger,
        channel: body.channel,
        subject: body.subject,
        body: body.body,
        htmlBody: body.htmlBody,
        triggerDelay: body.triggerDelay,
        triggerDays: body.triggerDays,
        reminderHours: body.reminderHours,
        locationId: body.locationId,
        templateId: body.templateId,
        status: body.status,
      },
      include: {
        location: true,
        template: true,
      },
    })

    return NextResponse.json({ automation })
  } catch (error) {
    console.error("Error updating automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete an automation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { automationId } = await params

    const automation = await db.automation.findFirst({
      where: { id: automationId, studioId },
    })

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 })
    }

    await db.automation.delete({
      where: { id: automationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Toggle automation active/paused
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { automationId } = await params
    const body = await request.json()
    const { action } = body // "activate" or "pause"

    const automation = await db.automation.findFirst({
      where: { id: automationId, studioId },
    })

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 })
    }

    let newStatus: "ACTIVE" | "PAUSED"
    if (action === "activate") {
      newStatus = "ACTIVE"
    } else if (action === "pause") {
      newStatus = "PAUSED"
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updated = await db.automation.update({
      where: { id: automationId },
      data: { status: newStatus },
    })

    return NextResponse.json({ automation: updated })
  } catch (error) {
    console.error("Error toggling automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

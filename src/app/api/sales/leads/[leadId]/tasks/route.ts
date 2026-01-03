import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// POST - Create a task for a lead
export async function POST(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params

    // Get agent profile
    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Verify the lead is assigned to this agent
    const lead = await db.lead.findFirst({
      where: {
        id: leadId,
        assignedToId: agent.id
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found or not assigned to you" }, { status: 404 })
    }

    const data = await request.json()

    const task = await db.leadTask.create({
      data: {
        leadId,
        assignedToId: agent.id,
        title: data.title,
        description: data.description || null,
        type: data.type || "follow_up",
        priority: data.priority || "MEDIUM",
        status: "PENDING",
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date()
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Failed to create task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

// PATCH - Update a task (complete it)
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

    // Get agent profile
    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Verify the lead is assigned to this agent
    const lead = await db.lead.findFirst({
      where: {
        id: leadId,
        assignedToId: agent.id
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found or not assigned to you" }, { status: 404 })
    }

    // Verify the task belongs to this lead
    const existingTask = await db.leadTask.findFirst({
      where: {
        id: data.taskId,
        leadId
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const task = await db.leadTask.update({
      where: { id: data.taskId },
      data: {
        status: data.status,
        completedAt: data.status === "COMPLETED" ? new Date() : null
      }
    })

    // Log activity if task is completed
    if (data.status === "COMPLETED") {
      await db.leadActivity.create({
        data: {
          leadId,
          agentId: agent.id,
          type: "TASK_COMPLETED",
          subject: `Task completed: ${existingTask.title}`,
          content: `Completed task: ${existingTask.title}`
        }
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Failed to update task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}










import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - Get tasks for a lead
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

    const tasks = await db.leadTask.findMany({
      where: { leadId },
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
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

// POST - Create a new task
export async function POST(
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

    // Get sales agent for current user
    const agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    const task = await db.leadTask.create({
      data: {
        leadId,
        title: data.title,
        description: data.description,
        type: data.type || "follow_up",
        priority: data.priority || "MEDIUM",
        dueDate: new Date(data.dueDate),
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
        assignedToId: data.assignedToId || agent?.id
      },
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
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Failed to create task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

// PATCH - Update task (complete, etc.)
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

    if (!data.taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status) {
      updateData.status = data.status
      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date()
        
        // Log task completion activity
        const agent = await db.salesAgent.findUnique({
          where: { userId: session.user.id }
        })
        
        const task = await db.leadTask.findUnique({
          where: { id: data.taskId }
        })
        
        if (task) {
          await db.leadActivity.create({
            data: {
              leadId,
              type: "TASK_COMPLETED",
              content: `Task completed: ${task.title}`,
              agentId: agent?.id
            }
          })
        }
      }
    }

    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.priority) updateData.priority = data.priority
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId || null

    const task = await db.leadTask.update({
      where: { id: data.taskId },
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
        }
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Failed to update task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

// DELETE - Delete task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    await db.leadTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}














import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List leads assigned to the current sales agent
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "SALES_AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create sales agent for current user
    let agent = await db.salesAgent.findUnique({
      where: { userId: session.user.id }
    })

    if (!agent) {
      agent = await db.salesAgent.create({
        data: {
          userId: session.user.id,
          title: "Sales Agent"
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {
      assignedToId: agent.id
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { studioName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } }
      ]
    }

    const leads = await db.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
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
        tasks: {
          where: { status: "PENDING" },
          orderBy: { dueDate: "asc" }
        },
        _count: {
          select: {
            activities: true,
            tasks: { where: { status: "PENDING" } }
          }
        }
      }
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error("Failed to fetch leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}













import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List all sales agents
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agents = await db.salesAgent.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            leads: true,
            tasks: { where: { status: "PENDING" } }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Failed to fetch agents:", error)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }
}

// POST - Create or update sales agent profile
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const userId = data.userId || session.user.id

    // Check if agent already exists
    const existingAgent = await db.salesAgent.findUnique({
      where: { userId }
    })

    let agent
    if (existingAgent) {
      agent = await db.salesAgent.update({
        where: { userId },
        data: {
          title: data.title,
          phone: data.phone,
          calendarLink: data.calendarLink,
          isActive: data.isActive ?? true,
          canReceiveLeads: data.canReceiveLeads ?? true,
          maxLeads: data.maxLeads
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    } else {
      agent = await db.salesAgent.create({
        data: {
          userId,
          title: data.title,
          phone: data.phone,
          calendarLink: data.calendarLink,
          isActive: data.isActive ?? true,
          canReceiveLeads: data.canReceiveLeads ?? true,
          maxLeads: data.maxLeads
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("Failed to create/update agent:", error)
    return NextResponse.json({ error: "Failed to create/update agent" }, { status: 500 })
  }
}














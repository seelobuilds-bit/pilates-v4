import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

// GET - List all leads with filtering
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedToId = searchParams.get("assignedToId")
    const source = searchParams.get("source")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}

    if (status && status !== "all") {
      where.status = status
    }
    if (assignedToId && assignedToId !== "all") {
      where.assignedToId = assignedToId === "unassigned" ? null : assignedToId
    }
    if (source && source !== "all") {
      where.source = source
    }
    if (priority && priority !== "all") {
      where.priority = priority
    }
    if (search) {
      where.OR = [
        { studioName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } }
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
        _count: {
          select: {
            activities: true,
            tasks: { where: { status: "PENDING" } }
          }
        }
      }
    })

    // Get pipeline stats
    const stats = await db.lead.groupBy({
      by: ["status"],
      _count: true,
      _sum: {
        estimatedValue: true
      }
    })

    return NextResponse.json({ leads, stats })
  } catch (error) {
    console.error("Failed to fetch leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

// POST - Create a new lead
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const lead = await db.lead.create({
      data: {
        studioName: data.studioName,
        website: data.website,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactRole: data.contactRole,
        city: data.city,
        state: data.state,
        country: data.country || "US",
        timezone: data.timezone,
        status: data.status || "NEW",
        source: data.source || "OTHER",
        priority: data.priority || "MEDIUM",
        currentSoftware: data.currentSoftware,
        studioSize: data.studioSize,
        monthlyRevenue: data.monthlyRevenue,
        painPoints: data.painPoints,
        notes: data.notes,
        estimatedValue: data.estimatedValue,
        probability: data.probability,
        expectedClose: data.expectedClose ? new Date(data.expectedClose) : undefined,
        assignedToId: data.assignedToId,
        assignedAt: data.assignedToId ? new Date() : undefined,
        tags: data.tags || []
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

    // Create initial activity
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "SYSTEM",
        content: "Lead created"
      }
    })

    // Update agent lead count
    if (data.assignedToId) {
      await db.salesAgent.update({
        where: { id: data.assignedToId },
        data: { totalLeads: { increment: 1 } }
      })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error("Failed to create lead:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}

// PUT - Bulk import leads
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leads } = await request.json()

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "Invalid leads data" }, { status: 400 })
    }

    const results = {
      created: 0,
      errors: [] as string[]
    }

    for (const leadData of leads) {
      try {
        await db.lead.create({
          data: {
            studioName: leadData.studioName || "Unknown Studio",
            contactName: leadData.contactName || "Unknown",
            contactEmail: leadData.contactEmail || leadData.email || "",
            contactPhone: leadData.contactPhone || leadData.phone,
            contactRole: leadData.contactRole,
            city: leadData.city,
            state: leadData.state,
            country: leadData.country || "US",
            source: leadData.source || "OTHER",
            priority: leadData.priority || "MEDIUM",
            currentSoftware: leadData.currentSoftware,
            studioSize: leadData.studioSize,
            notes: leadData.notes
          }
        })
        results.created++
      } catch (err) {
        results.errors.push(`Failed to import: ${leadData.contactEmail || leadData.studioName}`)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Failed to import leads:", error)
    return NextResponse.json({ error: "Failed to import leads" }, { status: 500 })
  }
}













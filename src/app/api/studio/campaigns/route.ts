import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all campaigns for the studio
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId

    const campaigns = await db.campaign.findMany({
      where: { studioId },
      orderBy: { createdAt: "desc" },
      include: {
        segment: {
          select: { id: true, name: true },
        },
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

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new campaign
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
      channel, 
      subject, 
      body: messageBody, 
      htmlBody,
      targetAll,
      segmentId,
      locationId,
      templateId,
      scheduledAt,
    } = body

    if (!name || !channel || !messageBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const campaign = await db.campaign.create({
      data: {
        studioId,
        name,
        channel,
        subject,
        body: messageBody,
        htmlBody,
        targetAll: targetAll || false,
        segmentId,
        locationId,
        templateId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
      },
      include: {
        segment: true,
        location: true,
        template: true,
      },
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendEmail, sendSMS } from "@/lib/communications"

// GET - Fetch a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { campaignId } = await params

    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, studioId },
      include: {
        segment: true,
        location: true,
        template: true,
        messages: {
          take: 100,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update a campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { campaignId } = await params
    const body = await request.json()

    const existingCampaign = await db.campaign.findFirst({
      where: { id: campaignId, studioId },
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Don't allow editing sent campaigns
    if (existingCampaign.status === "SENT" || existingCampaign.status === "SENDING") {
      return NextResponse.json({ error: "Cannot edit a campaign that has been sent" }, { status: 400 })
    }

    const campaign = await db.campaign.update({
      where: { id: campaignId },
      data: {
        name: body.name,
        channel: body.channel,
        subject: body.subject,
        body: body.body,
        htmlBody: body.htmlBody,
        targetAll: body.targetAll,
        segmentId: body.segmentId,
        locationId: body.locationId,
        templateId: body.templateId,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: body.scheduledAt ? "SCHEDULED" : "DRAFT",
      },
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { campaignId } = await params

    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, studioId },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    await db.campaign.delete({
      where: { id: campaignId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Send/Launch the campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const { campaignId } = await params

    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, studioId },
      include: {
        segment: true,
        location: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.status === "SENT" || campaign.status === "SENDING") {
      return NextResponse.json({ error: "Campaign already sent" }, { status: 400 })
    }

    // Update status to sending
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    })

    // Get target clients
    const clientFilter: {
      studioId: string
      isActive: boolean
      locationId?: string
    } = {
      studioId,
      isActive: true,
    }

    // If targeting specific location, we'd need to filter clients by their bookings at that location
    // For now, we'll send to all active clients or use segment rules

    const clients = await db.client.findMany({
      where: clientFilter,
    })

    let sentCount = 0
    let failedCount = 0

    // Send to each client
    for (const client of clients) {
      try {
        if (campaign.channel === "EMAIL") {
          if (!client.email) continue
          
          const result = await sendEmail({
            to: client.email,
            subject: campaign.subject || "Message from your studio",
            body: campaign.htmlBody || campaign.body,
          })
          
          if (result.success) sentCount++
          else failedCount++
        } else if (campaign.channel === "SMS") {
          if (!client.phone) continue
          
          const result = await sendSMS(studioId, {
            to: client.phone,
            toName: `${client.firstName} ${client.lastName}`,
            body: campaign.body,
            clientId: client.id,
            campaignId: campaign.id,
          })
          
          if (result.success) sentCount++
          else failedCount++
        }
      } catch (error) {
        console.error(`Error sending to client ${client.id}:`, error)
        failedCount++
      }
    }

    // Update campaign stats
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        totalRecipients: clients.length,
        sentCount,
        failedCount,
      },
    })

    return NextResponse.json({ 
      success: true,
      totalRecipients: clients.length,
      sentCount,
      failedCount,
    })
  } catch (error) {
    console.error("Error sending campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

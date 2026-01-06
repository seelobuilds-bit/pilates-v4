import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST - Public endpoint for booking demos from website
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.studioName || !data.contactName || !data.contactEmail) {
      return NextResponse.json({ 
        error: "Studio name, contact name, and email are required" 
      }, { status: 400 })
    }

    // Create the demo booking
    const demo = await db.demoBooking.create({
      data: {
        studioName: data.studioName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        requestedDate: data.requestedDate ? new Date(data.requestedDate) : undefined,
        studioSize: data.studioSize,
        currentSoftware: data.currentSoftware,
        interests: data.interests,
        referralSource: data.referralSource,
        status: "pending"
      }
    })

    // Create or update lead from demo booking
    const existingLead = await db.lead.findFirst({
      where: { contactEmail: data.contactEmail }
    })

    let lead
    if (existingLead) {
      // Update existing lead
      lead = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          status: "DEMO_SCHEDULED",
          notes: existingLead.notes 
            ? `${existingLead.notes}\n\n[Demo Request] ${data.interests || ''}`
            : `[Demo Request] ${data.interests || ''}`
        }
      })
    } else {
      // Create new lead
      lead = await db.lead.create({
        data: {
          studioName: data.studioName,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          source: "INBOUND_DEMO",
          status: "DEMO_SCHEDULED",
          studioSize: data.studioSize,
          currentSoftware: data.currentSoftware,
          notes: data.interests ? `[Demo Request] ${data.interests}` : undefined
        }
      })

      // Create activity for new lead
      await db.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "SYSTEM",
          content: "Lead created from demo booking request"
        }
      })
    }

    // Link demo to lead
    await db.demoBooking.update({
      where: { id: demo.id },
      data: { leadId: lead.id }
    })

    return NextResponse.json({ 
      success: true,
      message: "Demo booking submitted successfully. We'll be in touch soon!"
    })
  } catch (error) {
    console.error("Failed to create demo booking:", error)
    return NextResponse.json({ error: "Failed to submit demo booking" }, { status: 500 })
  }
}













import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendStudioWelcomeEmail } from "@/lib/email"
import crypto from "crypto"

/**
 * POST - Convert a lead to an active studio
 * 
 * This creates a new studio from the lead's information,
 * sends them the welcome email with setup link,
 * and marks the lead as converted.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params
    const body = await request.json()
    const { subdomain } = body

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
    }

    // Get the lead
    const lead = await db.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (lead.convertedStudioId) {
      return NextResponse.json({ error: "Lead already converted" }, { status: 400 })
    }

    // Check if subdomain is available
    const existingStudio = await db.studio.findUnique({
      where: { subdomain: subdomain.toLowerCase() }
    })

    if (existingStudio) {
      return NextResponse.json({ error: "Subdomain already taken" }, { status: 400 })
    }

    // Check if email is already used
    const existingUser = await db.user.findUnique({
      where: { email: lead.contactEmail.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use by another account" }, { status: 400 })
    }

    // Generate setup token
    const setupToken = crypto.randomBytes(32).toString("hex")
    const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Parse contact name into first/last
    const nameParts = lead.contactName.trim().split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || nameParts[0]

    // Create the studio with owner
    const studio = await db.studio.create({
      data: {
        name: lead.studioName,
        subdomain: subdomain.toLowerCase(),
        owner: {
          create: {
            email: lead.contactEmail.toLowerCase(),
            password: "", // Empty - will be set via setup link
            firstName,
            lastName,
            role: "OWNER",
            resetToken: setupToken,
            resetTokenExpiry: setupTokenExpiry,
          }
        }
      },
      include: {
        owner: true,
      }
    })

    // Update the lead to mark as converted
    await db.lead.update({
      where: { id: leadId },
      data: {
        status: "WON",
        wonDate: new Date(),
        convertedStudioId: studio.id
      }
    })

    // Log the conversion as an activity
    await db.leadActivity.create({
      data: {
        leadId,
        type: "SYSTEM",
        content: `Lead converted to studio: ${studio.name} (${subdomain})`,
        newStatus: "WON"
      }
    })

    // Send welcome email with setup link
    const baseUrl = process.env.NEXTAUTH_URL || "https://pilates-v4-soulflow.vercel.app"
    const setupUrl = `${baseUrl}/setup-account?token=${setupToken}`

    const emailResult = await sendStudioWelcomeEmail({
      ownerEmail: lead.contactEmail,
      ownerName: firstName,
      studioName: lead.studioName,
      setupUrl
    })

    return NextResponse.json({
      success: true,
      studioId: studio.id,
      studioName: studio.name,
      subdomain: studio.subdomain,
      emailSent: emailResult.success,
      setupUrl: emailResult.success ? undefined : setupUrl // Include URL if email failed
    })
  } catch (error) {
    console.error("Failed to convert lead:", error)
    return NextResponse.json({ error: "Failed to convert lead" }, { status: 500 })
  }
}


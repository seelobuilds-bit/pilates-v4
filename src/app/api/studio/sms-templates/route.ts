import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { SystemSmsType } from "@prisma/client"

// Default SMS templates
const defaultSmsTemplates: Array<{
  type: SystemSmsType
  name: string
  body: string
  variables: string[]
}> = [
  {
    type: "BOOKING_CONFIRMATION",
    name: "Booking Confirmation",
    body: `Hi {{firstName}}! Your {{className}} class is booked for {{date}} at {{time}}. See you at {{locationName}}! - {{studioName}}`,
    variables: ["firstName", "className", "date", "time", "locationName", "studioName"]
  },
  {
    type: "CLASS_CANCELLED",
    name: "Class Cancelled",
    body: `Hi {{firstName}}, your {{className}} on {{date}} at {{time}} has been cancelled. We apologize for any inconvenience. - {{studioName}}`,
    variables: ["firstName", "className", "date", "time", "studioName"]
  },
  {
    type: "WAITLIST_NOTIFICATION",
    name: "Waitlist Spot Available",
    body: `{{firstName}}, a spot opened in {{className}} on {{date}}! Claim it now: {{claimUrl}} (expires in 2hrs) - {{studioName}}`,
    variables: ["firstName", "className", "date", "time", "claimUrl", "studioName"]
  }
]

// Template types that are valid (handled in this settings area, not marketing)
const validSmsTypes: SystemSmsType[] = defaultSmsTemplates.map(t => t.type)

// Template types that should be removed (now handled in marketing section)
const deprecatedSmsTypes: SystemSmsType[] = ["CLASS_REMINDER_24HR", "CLASS_REMINDER_1HR"]

// GET - Fetch all SMS templates for studio
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Clean up deprecated template types (handled in marketing section now)
    await db.systemSmsTemplate.deleteMany({
      where: {
        studioId: session.user.studioId,
        type: { in: deprecatedSmsTypes }
      }
    })

    // Check if templates exist for this studio
    let templates = await db.systemSmsTemplate.findMany({
      where: { 
        studioId: session.user.studioId,
        type: { in: validSmsTypes }
      },
      orderBy: { type: "asc" }
    })

    // If no templates exist, create all defaults
    if (templates.length === 0) {
      await db.systemSmsTemplate.createMany({
        data: defaultSmsTemplates.map(t => ({
          ...t,
          studioId: session.user.studioId!
        }))
      })

      templates = await db.systemSmsTemplate.findMany({
        where: { studioId: session.user.studioId },
        orderBy: { type: "asc" }
      })
    } else {
      // Check for any missing templates and add them
      const existingTypes = templates.map(t => t.type)
      const missingTemplates = defaultSmsTemplates.filter(dt => !existingTypes.includes(dt.type))
      
      if (missingTemplates.length > 0) {
        await db.systemSmsTemplate.createMany({
          data: missingTemplates.map(t => ({
            ...t,
            studioId: session.user.studioId!
          }))
        })

        // Re-fetch all templates
        templates = await db.systemSmsTemplate.findMany({
          where: { studioId: session.user.studioId },
          orderBy: { type: "asc" }
        })
      }
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Failed to fetch SMS templates:", error)
    return NextResponse.json({ error: "Failed to fetch SMS templates" }, { status: 500 })
  }
}

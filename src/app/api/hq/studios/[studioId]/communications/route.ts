import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch studio communication settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params

    const studio = await db.studio.findUnique({
      where: { id: studioId },
      include: {
        emailConfig: true,
        smsConfig: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const emailConfig = studio.emailConfig ? { ...studio.emailConfig } : null

    const smsConfig = studio.smsConfig ? {
      ...studio.smsConfig,
      accountSid: studio.smsConfig.accountSid ? "••••••••" : null,
      authToken: studio.smsConfig.authToken ? "••••••••" : null,
    } : null

    return NextResponse.json({
      emailConfig,
      smsConfig,
    })
  } catch (error) {
    console.error("Error fetching studio communications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update studio communication settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params
    const body = await request.json()
    const { emailConfig, smsConfig } = body

    const studio = await db.studio.findUnique({
      where: { id: studioId },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Update email config
    if (emailConfig) {
      const existingEmailConfig = await db.studioEmailConfig.findUnique({
        where: { studioId },
      })

      const emailData = {
        fromName: emailConfig.fromName,
        fromEmail: emailConfig.fromEmail || null,
        replyToEmail: emailConfig.replyToEmail || null,
        useFallback: emailConfig.useFallback ?? true,
      }

      if (existingEmailConfig) {
        await db.studioEmailConfig.update({
          where: { studioId },
          data: emailData,
        })
      } else {
        await db.studioEmailConfig.create({
          data: {
            ...emailData,
            studioId,
          },
        })
      }
    }

    // Update SMS config
    if (smsConfig) {
      const existingSmsConfig = await db.studioSmsConfig.findUnique({
        where: { studioId },
      })

      // Only update credentials if not masked
      const smsData = {
        provider: smsConfig.provider,
        fromNumber: smsConfig.fromNumber,
        monthlyLimit: smsConfig.monthlyLimit || 1000,
        ...(smsConfig.accountSid !== "••••••••" && { accountSid: smsConfig.accountSid }),
        ...(smsConfig.authToken !== "••••••••" && { authToken: smsConfig.authToken }),
      }

      if (existingSmsConfig) {
        await db.studioSmsConfig.update({
          where: { studioId },
          data: smsData,
        })
      } else {
        await db.studioSmsConfig.create({
          data: {
            ...smsData,
            studioId,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating studio communications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

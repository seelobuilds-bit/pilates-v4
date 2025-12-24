import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch a specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { templateId } = await params

  try {
    const template = await db.systemEmailTemplate.findFirst({
      where: {
        id: templateId,
        studioId: session.user.studioId
      }
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to fetch email template:", error)
    return NextResponse.json({ error: "Failed to fetch email template" }, { status: 500 })
  }
}

// PATCH - Update an email template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { templateId } = await params

  try {
    // Verify the template belongs to this studio
    const existing = await db.systemEmailTemplate.findFirst({
      where: {
        id: templateId,
        studioId: session.user.studioId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const body = await request.json()
    const { subject, body: textBody, htmlBody, isEnabled } = body

    const template = await db.systemEmailTemplate.update({
      where: { id: templateId },
      data: {
        ...(subject !== undefined && { subject }),
        ...(textBody !== undefined && { body: textBody }),
        ...(htmlBody !== undefined && { htmlBody }),
        ...(isEnabled !== undefined && { isEnabled })
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Failed to update email template:", error)
    return NextResponse.json({ error: "Failed to update email template" }, { status: 500 })
  }
}












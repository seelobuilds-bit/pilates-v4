import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// PATCH - Update an SMS template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { templateId } = await params

  try {
    // Verify template belongs to this studio
    const existing = await db.systemSmsTemplate.findFirst({
      where: {
        id: templateId,
        studioId: session.user.studioId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const body = await request.json()
    const { body: smsBody, isEnabled } = body

    const updated = await db.systemSmsTemplate.update({
      where: { id: templateId },
      data: {
        ...(smsBody !== undefined && { body: smsBody }),
        ...(isEnabled !== undefined && { isEnabled })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update SMS template:", error)
    return NextResponse.json({ error: "Failed to update SMS template" }, { status: 500 })
  }
}

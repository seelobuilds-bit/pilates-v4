import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const VALID_SUBSCRIPTION_AUDIENCES = new Set(["STUDIO_OWNERS", "TEACHERS", "CLIENTS", "ALL"])

// PATCH - Update a module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { moduleId } = await params
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, dripDelay, isPublished, subscriptionAudience } = body
    const resolvedSubscriptionAudience = VALID_SUBSCRIPTION_AUDIENCES.has(subscriptionAudience)
      ? subscriptionAudience
      : undefined

    const updatedModule = await db.vaultModule.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dripDelay !== undefined && { dripDelay }),
        ...(isPublished !== undefined && { isPublished }),
        ...(resolvedSubscriptionAudience !== undefined && { subscriptionAudience: resolvedSubscriptionAudience })
      },
      include: {
        lessons: {
          orderBy: { order: "asc" }
        }
      }
    })

    return NextResponse.json(updatedModule)
  } catch (error) {
    console.error("Failed to update module:", error)
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
  }
}

// DELETE - Delete a module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { moduleId } = await params
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.vaultModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete module:", error)
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 })
  }
}














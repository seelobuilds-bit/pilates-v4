import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { keyId } = await params
  const body = await request.json().catch(() => null)
  const action = String(body?.action || "").trim().toLowerCase()

  if (!keyId) {
    return NextResponse.json({ error: "Key id is required" }, { status: 400 })
  }

  if (action !== "revoke" && action !== "activate") {
    return NextResponse.json({ error: "Action must be revoke or activate" }, { status: 400 })
  }

  const existing = await db.publicApiKey.findFirst({
    where: {
      id: keyId,
      studioId: session.user.studioId,
    },
    select: { id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 })
  }

  const updated = await db.publicApiKey.update({
    where: { id: keyId },
    data: {
      isActive: action === "activate",
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    key: updated,
  })
}

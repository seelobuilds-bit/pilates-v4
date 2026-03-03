import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { PUBLIC_API_SCOPES, createPublicApiKeyCredentials, normalizePublicApiScopes } from "@/lib/public-api"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const keys = await db.publicApiKey.findMany({
    where: { studioId: session.user.studioId },
    orderBy: { createdAt: "desc" },
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
    availableScopes: PUBLIC_API_SCOPES,
    keys: keys.map((key) => ({
      ...key,
      scopes: normalizePublicApiScopes(key.scopes),
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const name = String(body?.name || "").trim()
  const scopes = normalizePublicApiScopes(body?.scopes)
  const expiresAtInput = body?.expiresAt ? new Date(String(body.expiresAt)) : null
  const expiresAt = expiresAtInput && !Number.isNaN(expiresAtInput.getTime()) ? expiresAtInput : null

  if (!name) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 })
  }

  if (scopes.length === 0) {
    return NextResponse.json({ error: "At least one scope is required" }, { status: 400 })
  }

  const { apiKey, prefix, keyHash } = createPublicApiKeyCredentials()

  const key = await db.publicApiKey.create({
    data: {
      name,
      prefix,
      keyHash,
      scopes,
      expiresAt,
      studioId: session.user.studioId,
      createdByUserId: session.user.id,
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

  return NextResponse.json(
    {
      key: {
        ...key,
        scopes: normalizePublicApiScopes(key.scopes),
      },
      apiKey,
      warning: "This is the only time the full API key will be shown. Store it securely.",
    },
    { status: 201 }
  )
}

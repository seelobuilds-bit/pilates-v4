import { createHash, randomBytes, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const PUBLIC_API_SCOPES = [
  "studio.read",
  "teachers.read",
  "clients.read",
  "class-types.read",
  "sessions.read",
] as const

export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number]

const PUBLIC_API_SCOPE_SET = new Set<string>(PUBLIC_API_SCOPES)
const MAX_PUBLIC_API_LIMIT = 100

export function normalizePublicApiScopes(input: unknown): PublicApiScope[] {
  if (!Array.isArray(input)) return []
  const values = Array.from(
    new Set(
      input
        .map((value) => String(value || "").trim())
        .filter((value): value is PublicApiScope => PUBLIC_API_SCOPE_SET.has(value))
    )
  )
  return values
}

export function parsePublicApiLimit(value: string | null, defaultValue = 50) {
  const parsed = Number.parseInt(String(value || ""), 10)
  if (!Number.isFinite(parsed)) return defaultValue
  return Math.max(1, Math.min(MAX_PUBLIC_API_LIMIT, parsed))
}

export function hashPublicApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex")
}

export function createPublicApiKeyCredentials() {
  const publicId = randomBytes(6).toString("hex")
  const secret = randomBytes(24).toString("hex")
  const prefix = `cur_pk_${publicId}`
  const apiKey = `${prefix}_${secret}`

  return {
    apiKey,
    prefix,
    keyHash: hashPublicApiKey(apiKey),
  }
}

export function extractPublicApiKey(request: NextRequest) {
  const fromHeader = request.headers.get("x-api-key")?.trim()
  if (fromHeader) return fromHeader

  const authHeader = request.headers.get("authorization")?.trim() || ""
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null
  const token = authHeader.slice(7).trim()
  return token || null
}

function extractPrefix(apiKey: string) {
  const lastSeparator = apiKey.lastIndexOf("_")
  if (lastSeparator <= 0) return null
  return apiKey.slice(0, lastSeparator)
}

function safeHashEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

export type PublicApiAuth = {
  keyId: string
  studioId: string
  studio: {
    id: string
    name: string
    subdomain: string
    primaryColor: string | null
    currency: string | null
  }
  scopes: PublicApiScope[]
}

export async function requirePublicApiAuth(request: NextRequest, requiredScopes: PublicApiScope | PublicApiScope[]) {
  const apiKey = extractPublicApiKey(request)
  if (!apiKey) {
    return {
      response: NextResponse.json({ error: "Missing API key" }, { status: 401 }),
      auth: null,
    }
  }

  const prefix = extractPrefix(apiKey)
  if (!prefix) {
    return {
      response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
      auth: null,
    }
  }

  const record = await db.publicApiKey.findUnique({
    where: { prefix },
    select: {
      id: true,
      keyHash: true,
      scopes: true,
      isActive: true,
      expiresAt: true,
      studioId: true,
      studio: {
        select: {
          id: true,
          name: true,
          subdomain: true,
          primaryColor: true,
          stripeCurrency: true,
        },
      },
    },
  })

  if (!record || !safeHashEquals(record.keyHash, hashPublicApiKey(apiKey))) {
    return {
      response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
      auth: null,
    }
  }

  if (!record.isActive) {
    return {
      response: NextResponse.json({ error: "API key inactive" }, { status: 403 }),
      auth: null,
    }
  }

  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    return {
      response: NextResponse.json({ error: "API key expired" }, { status: 403 }),
      auth: null,
    }
  }

  const scopes = normalizePublicApiScopes(record.scopes)
  const neededScopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes]
  const hasAllScopes = neededScopes.every((scope) => scopes.includes(scope))
  if (!hasAllScopes) {
    return {
      response: NextResponse.json({ error: "Insufficient API scope" }, { status: 403 }),
      auth: null,
    }
  }

  void db.publicApiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return {
    response: null,
    auth: {
      keyId: record.id,
      studioId: record.studioId,
      studio: {
        id: record.studio.id,
        name: record.studio.name,
        subdomain: record.studio.subdomain,
        primaryColor: record.studio.primaryColor,
        currency: record.studio.stripeCurrency,
      },
      scopes,
    } satisfies PublicApiAuth,
  }
}

export function withPublicApiHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Current-Api-Version", "v1")
  return response
}

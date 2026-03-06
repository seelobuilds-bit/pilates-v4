import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { verifyClientTokenValue } from "@/lib/client-auth"
import { PRIVATE_STORAGE_BUCKET } from "@/lib/storage"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function encodeStoragePath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/")
}

function hasHqAccess(role: string | null | undefined) {
  return role === "HQ_ADMIN" || role === "SALES_AGENT"
}

function resolveClientStudioIds(request: NextRequest) {
  return request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("client_token_"))
    .map((cookie) => verifyClientTokenValue(cookie.value)?.studioId || null)
    .filter((studioId): studioId is string => Boolean(studioId))
}

function canAccessPrivatePath(path: string, request: NextRequest, session: Awaited<ReturnType<typeof getSession>>) {
  if (path.includes("..")) return false

  const [scope, ownerId] = path.split("/", 3)
  if (!scope || !ownerId) return false

  if (scope === "hq") {
    return hasHqAccess(session?.user?.role)
  }

  if (scope !== "studio") {
    return false
  }

  if (session?.user?.studioId === ownerId) {
    return true
  }

  const clientStudioIds = resolveClientStudioIds(request)
  return clientStudioIds.includes(ownerId)
}

export async function GET(request: NextRequest) {
  const bucket = request.nextUrl.searchParams.get("bucket")
  const path = request.nextUrl.searchParams.get("path")

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 500 })
  }

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing media path." }, { status: 400 })
  }

  if (bucket !== PRIVATE_STORAGE_BUCKET) {
    return NextResponse.json({ error: "Unsupported media bucket." }, { status: 400 })
  }

  const session = await getSession()
  if (!canAccessPrivatePath(path, request, session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const upstream = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeStoragePath(path)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        ...(request.headers.get("range") ? { Range: request.headers.get("range") as string } : {}),
      },
    }
  )

  if (!upstream.ok) {
    return NextResponse.json({ error: "Failed to fetch media." }, { status: upstream.status })
  }

  const responseHeaders = new Headers()
  for (const header of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(header)
    if (value) responseHeaders.set(header, value)
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

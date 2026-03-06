const SUPABASE_URL = process.env.SUPABASE_URL

export const PUBLIC_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads"
export const PRIVATE_STORAGE_BUCKET = process.env.SUPABASE_PRIVATE_STORAGE_BUCKET || "uploads-private"

function encodeStoragePath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/")
}

export function buildPublicStorageUrl(path: string, bucket: string = PUBLIC_STORAGE_BUCKET) {
  if (!SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(path)}`
}

export function buildProtectedMediaUrl(path: string, bucket: string = PRIVATE_STORAGE_BUCKET) {
  const params = new URLSearchParams({
    bucket,
    path,
  })
  return `/api/media?${params.toString()}`
}

export function parseManagedStorageUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return null

  try {
    const parsed = rawUrl.startsWith("/")
      ? new URL(rawUrl, "http://localhost")
      : new URL(rawUrl)

    if (parsed.pathname === "/api/media") {
      const bucket = parsed.searchParams.get("bucket")
      const path = parsed.searchParams.get("path")
      if (!bucket || !path) return null
      return {
        kind: "protected" as const,
        bucket,
        path,
      }
    }

    const marker = `/storage/v1/object/public/`
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex === -1) return null

    const remainder = parsed.pathname.slice(markerIndex + marker.length)
    const slashIndex = remainder.indexOf("/")
    if (slashIndex === -1) return null

    return {
      kind: "public" as const,
      bucket: decodeURIComponent(remainder.slice(0, slashIndex)),
      path: decodeURIComponent(remainder.slice(slashIndex + 1)),
    }
  } catch {
    return null
  }
}

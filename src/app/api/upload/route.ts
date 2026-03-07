import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import {
  buildProtectedMediaUrl,
  buildPublicStorageUrl,
  parseManagedStorageUrl,
  PRIVATE_STORAGE_BUCKET,
  PUBLIC_STORAGE_BUCKET,
} from "@/lib/storage"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getUploadFolder(formData: FormData): string {
  const explicitFolder = formData.get("folder")
  if (typeof explicitFolder === "string" && explicitFolder.trim().length > 0) {
    const sanitized = sanitizeFolder(explicitFolder)
    return sanitized || "misc"
  }

  const type = formData.get("type")
  if (typeof type === "string") {
    if (type === "video") return "videos"
    if (type === "pdf") return "pdfs"
    if (type === "thumbnail") return "thumbnails"
  }

  return "misc"
}

function getUploadVisibility(formData: FormData): "public" | "private" {
  return formData.get("visibility") === "private" ? "private" : "public"
}

function sanitizeFolder(folder: string): string {
  return folder
    .split("/")
    .map((part) => part.trim().replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/")
}

function encodeStoragePath(path: string): string {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/")
}

function assertStorageConfig(): string | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return "Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  }
  return null
}

async function getUploadScope(args: {
  userId?: string | null
  role?: string | null
  studioId?: string | null
}) {
  const { userId, role, studioId } = args

  if (role === "HQ_ADMIN") {
    return {
      publicPrefix: userId ? `hq/${userId}/` : null,
      privatePrefix: userId ? `hq/${userId}/` : null,
      legacyPublicPrefixes: [] as string[],
      canManageAll: true,
    }
  }

  if (!studioId) {
    return {
      publicPrefix: null,
      privatePrefix: null,
      legacyPublicPrefixes: [] as string[],
      canManageAll: false,
    }
  }

  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: { subdomain: true },
  })

  return {
    publicPrefix: `studio/${studioId}/`,
    privatePrefix: `studio/${studioId}/`,
    legacyPublicPrefixes: studio?.subdomain ? [`studio-logos/${studio.subdomain}/`] : [],
    canManageAll: false,
  }
}

function isPathAuthorized(args: {
  path: string
  bucket: string
  publicPrefix: string | null
  privatePrefix: string | null
  legacyPublicPrefixes: string[]
  canManageAll: boolean
}) {
  const { path, bucket, publicPrefix, privatePrefix, legacyPublicPrefixes, canManageAll } = args

  if (canManageAll) return true

  if (bucket === PRIVATE_STORAGE_BUCKET) {
    return Boolean(privatePrefix && path.startsWith(privatePrefix))
  }

  if (bucket === PUBLIC_STORAGE_BUCKET) {
    return Boolean(
      (publicPrefix && path.startsWith(publicPrefix)) ||
        legacyPublicPrefixes.some((prefix) => path.startsWith(prefix))
    )
  }

  return false
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = getUploadFolder(formData)
    const visibility = getUploadVisibility(formData)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (50MB max for videos, 10MB for others)
    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${file.type.startsWith("video/") ? "50MB" : "10MB"}` 
      }, { status: 400 })
    }

    // Validate file types
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm", "video/quicktime",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Allowed: images, videos, PDF, Word, Excel, PowerPoint" 
      }, { status: 400 })
    }

    const configError = assertStorageConfig()
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 })
    }
    const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY as string

    const bucket = visibility === "private" ? PRIVATE_STORAGE_BUCKET : PUBLIC_STORAGE_BUCKET
    const scope = await getUploadScope({
      userId: session.user.id,
      role: session.user.role,
      studioId: session.user.studioId,
    })

    const basePrefix =
      visibility === "private"
        ? scope.privatePrefix
        : scope.publicPrefix

    // Create unique object path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const relativeObjectPath = `${folder}/${timestamp}-${sanitizedName}`

    if (!basePrefix) {
      return NextResponse.json({ error: "Upload scope unavailable" }, { status: 403 })
    }

    const objectPath = `${basePrefix}${relativeObjectPath}`
    const encodedPath = encodeStoragePath(objectPath)

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "x-upsert": "false",
          "content-type": file.type || "application/octet-stream",
        },
        body: file,
      }
    )

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      return NextResponse.json({
        error: `Supabase upload failed (${uploadRes.status}): ${errorText || "Unknown error"}`
      }, { status: 500 })
    }

    const url =
      visibility === "private"
        ? buildProtectedMediaUrl(objectPath, bucket)
        : buildPublicStorageUrl(objectPath, bucket)

    return NextResponse.json({
      url,
      path: objectPath,
      bucket,
      visibility,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const configError = assertStorageConfig()
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 })
    }
    const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY as string

    const { url, path, bucket } = await request.json()
    const managedUrl = typeof url === "string" ? parseManagedStorageUrl(url) : null
    const objectPath = typeof path === "string" && path.trim().length > 0
      ? path
      : (managedUrl?.path ?? null)
    const targetBucket =
      typeof bucket === "string" && bucket.trim().length > 0
        ? bucket
        : (managedUrl?.bucket ?? PUBLIC_STORAGE_BUCKET)

    if (!objectPath) {
      return NextResponse.json({ error: "No valid file path or URL provided" }, { status: 400 })
    }

    if (objectPath.includes("..")) {
      return NextResponse.json({ error: "Invalid object path" }, { status: 400 })
    }

    const scope = await getUploadScope({
      userId: session.user.id,
      role: session.user.role,
      studioId: session.user.studioId,
    })

    if (
      !isPathAuthorized({
        path: objectPath,
        bucket: targetBucket,
        publicPrefix: scope.publicPrefix,
        privatePrefix: scope.privatePrefix,
        legacyPublicPrefixes: scope.legacyPublicPrefixes,
        canManageAll: scope.canManageAll,
      })
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const encodedPath = encodeStoragePath(objectPath)
    const deleteRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(targetBucket)}/${encodedPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    )

    if (!deleteRes.ok) {
      const errorText = await deleteRes.text()
      return NextResponse.json({
        error: `Supabase delete failed (${deleteRes.status}): ${errorText || "Unknown error"}`
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: objectPath })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads"

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

function extractPathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    const rawPath = parsed.pathname.slice(idx + marker.length)
    return decodeURIComponent(rawPath)
  } catch {
    return null
  }
}

function assertStorageConfig(): string | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return "Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  }
  return null
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

    // Create unique object path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const objectPath = `${folder}/${timestamp}-${sanitizedName}`
    const encodedPath = encodeStoragePath(objectPath)

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encodedPath}`,
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

    const publicUrl =
      `${SUPABASE_URL}/storage/v1/object/public/` +
      `${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encodedPath}`

    return NextResponse.json({
      url: publicUrl,
      path: objectPath,
      bucket: SUPABASE_STORAGE_BUCKET,
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

    const { url, path } = await request.json()
    const objectPath = typeof path === "string" && path.trim().length > 0
      ? path
      : (typeof url === "string" ? extractPathFromPublicUrl(url) : null)

    if (!objectPath) {
      return NextResponse.json({ error: "No valid file path or URL provided" }, { status: 400 })
    }

    if (objectPath.includes("..")) {
      return NextResponse.json({ error: "Invalid object path" }, { status: 400 })
    }

    const encodedPath = encodeStoragePath(objectPath)
    const deleteRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${encodedPath}`,
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

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

// POST - Upload file (video, pdf, or image)
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string // "video", "pdf", or "thumbnail"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes: Record<string, string[]> = {
      video: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
      pdf: ["application/pdf"],
      thumbnail: ["image/jpeg", "image/png", "image/webp", "image/gif"]
    }

    if (!type || !allowedTypes[type]) {
      return NextResponse.json({ error: "Invalid file type category" }, { status: 400 })
    }

    if (!allowedTypes[type].includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: ${allowedTypes[type].join(", ")}` 
      }, { status: 400 })
    }

    // File size limits
    const maxSizes: Record<string, number> = {
      video: 500 * 1024 * 1024,  // 500MB for videos
      pdf: 50 * 1024 * 1024,      // 50MB for PDFs
      thumbnail: 10 * 1024 * 1024 // 10MB for thumbnails
    }

    if (file.size > maxSizes[type]) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${maxSizes[type] / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split(".").pop()
    const filename = `${timestamp}-${randomId}.${ext}`

    // Determine upload directory
    const uploadDirs: Record<string, string> = {
      video: "videos",
      pdf: "pdfs",
      thumbnail: "thumbnails"
    }
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", uploadDirs[type])
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, filename)
    
    await writeFile(filePath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${uploadDirs[type]}/${filename}`

    return NextResponse.json({ 
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

// Configure to handle large files
export const config = {
  api: {
    bodyParser: false,
  },
}

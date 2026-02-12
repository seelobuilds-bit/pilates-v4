import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"

// GET - Fetch studio settings
export async function GET() {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  try {
    const studio = await db.studio.findUnique({
      where: { id: auth.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
      }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to fetch studio settings:", error)
    return NextResponse.json({ error: "Failed to fetch studio settings" }, { status: 500 })
  }
}

// PATCH - Update studio settings
export async function PATCH(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  try {
    const body = await request.json()
    const { name, primaryColor } = body

    const studio = await db.studio.update({
      where: { id: auth.studioId },
      data: {
        ...(name !== undefined && { name }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
      }
    })

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to update studio settings:", error)
    return NextResponse.json({ error: "Failed to update studio settings" }, { status: 500 })
  }
}

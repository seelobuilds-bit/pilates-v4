import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch studio settings
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        logo: true,
        email: true,
        phone: true,
        website: true,
        timezone: true,
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
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, primaryColor, logo, email, phone, website, timezone } = body

    const studio = await db.studio.update({
      where: { id: session.user.studioId },
      data: {
        ...(name !== undefined && { name }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(logo !== undefined && { logo }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        logo: true,
        email: true,
        phone: true,
        website: true,
        timezone: true,
      }
    })

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to update studio settings:", error)
    return NextResponse.json({ error: "Failed to update studio settings" }, { status: 500 })
  }
}

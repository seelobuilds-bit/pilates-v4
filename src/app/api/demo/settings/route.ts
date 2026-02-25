import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET() {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
    }

    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to fetch demo studio settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

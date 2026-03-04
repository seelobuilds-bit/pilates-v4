import { NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { fetchStudioBrandingSummary } from "@/lib/studio-read-models"

export async function GET() {
  try {
    const studioId = await getDemoStudioId()
    if (!studioId) {
      return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
    }

    const studio = await fetchStudioBrandingSummary(studioId)

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to fetch demo studio settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

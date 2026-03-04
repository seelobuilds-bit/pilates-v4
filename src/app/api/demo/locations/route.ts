import { NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { fetchStudioLocations } from "@/lib/studio-directory-query"

export async function GET() {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const locations = await fetchStudioLocations(studioId)

  return NextResponse.json(locations)
}

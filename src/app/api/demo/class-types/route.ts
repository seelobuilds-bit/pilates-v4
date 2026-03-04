import { NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { fetchStudioClassTypes } from "@/lib/studio-directory-query"

export async function GET() {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const classTypes = await fetchStudioClassTypes(studioId)

  return NextResponse.json(classTypes)
}

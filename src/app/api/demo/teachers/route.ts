import { NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { fetchStudioTeachers } from "@/lib/studio-directory-query"

export async function GET() {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const teachers = await fetchStudioTeachers(studioId)

  return NextResponse.json(teachers)
}

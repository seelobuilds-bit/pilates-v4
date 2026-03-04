import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { fetchStudioBlockedTimes } from "@/lib/studio-read-models"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const teacherId = searchParams.get("teacherId")

  const blockedTimes = await fetchStudioBlockedTimes({
    studioId,
    start,
    end,
    teacherId,
  })

  return NextResponse.json(blockedTimes)
}

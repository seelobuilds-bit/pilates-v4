import { NextRequest, NextResponse } from "next/server"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"
import { fetchStudioBlockedTimes } from "@/lib/studio-read-models"

// GET - Fetch all blocked times for all teachers in the studio (for schedule view)
export async function GET(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const teacherId = searchParams.get("teacherId")

  try {
    const blockedTimes = await fetchStudioBlockedTimes({
      studioId: auth.studioId,
      start,
      end,
      teacherId,
    })

    return NextResponse.json(blockedTimes)
  } catch (error) {
    console.error("Failed to fetch blocked times:", error)
    return NextResponse.json({ error: "Failed to fetch blocked times" }, { status: 500 })
  }
}


























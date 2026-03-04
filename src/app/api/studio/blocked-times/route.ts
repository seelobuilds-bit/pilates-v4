import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { fetchStudioBlockedTimes } from "@/lib/studio-read-models"

// GET - Fetch all blocked times for all teachers in the studio (for schedule view)
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const teacherId = searchParams.get("teacherId")

  try {
    const blockedTimes = await fetchStudioBlockedTimes({
      studioId: session.user.studioId,
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



























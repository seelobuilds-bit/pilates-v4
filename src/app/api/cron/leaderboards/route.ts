import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return request.headers.get("authorization") === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    const session = await getSession()
    if (session?.user?.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await runLeaderboardAutoCycle()
    return NextResponse.json({
      ok: true,
      ...result,
      ranAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Leaderboard auto-cycle failed:", error)
    return NextResponse.json({ error: "Failed to run leaderboard auto-cycle" }, { status: 500 })
  }
}

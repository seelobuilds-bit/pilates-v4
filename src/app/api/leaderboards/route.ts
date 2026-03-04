import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"
import {
  loadEnrichedLeaderboards,
  loadViewerEntryByPeriodId,
} from "@/lib/leaderboards/query"
import {
  buildUserRanksByLeaderboardId,
  collectCurrentPeriodIds,
  groupLeaderboardsByDisplayCategory,
  LEADERBOARD_DISPLAY_CATEGORIES,
} from "@/lib/leaderboards/presentation"

// GET - Fetch leaderboards for studios/teachers
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const participantTypeParam = searchParams.get("type")
  const participantType: LeaderboardParticipantType =
    participantTypeParam === "TEACHER" ? "TEACHER" : "STUDIO"
  const category = searchParams.get("category")
  const featured = searchParams.get("featured") === "true"
  const categoryFilter =
    category && Object.values(LeaderboardCategory).includes(category as LeaderboardCategory)
      ? (category as LeaderboardCategory)
      : null

  try {
    if (process.env.LEADERBOARD_AUTO_CYCLE_ON_READ === "1") {
      try {
        await runLeaderboardAutoCycle()
      } catch (cycleError) {
        console.error("Leaderboard auto-cycle skipped due to error:", cycleError)
      }
    }

    const enrichedLeaderboards = await loadEnrichedLeaderboards({
      participantType,
      categoryFilter,
      featuredOnly: featured,
      includePrizes: true,
    })

    const viewerEntryByPeriodId = await loadViewerEntryByPeriodId({
      participantType,
      periodIds: collectCurrentPeriodIds(enrichedLeaderboards),
      studioId: session.user.studioId,
      teacherId: session.user.teacherId,
    })
    const userRanks = buildUserRanksByLeaderboardId(enrichedLeaderboards, viewerEntryByPeriodId)

    // Group leaderboards by category for UI
    const groupedLeaderboards = groupLeaderboardsByDisplayCategory(enrichedLeaderboards)

    return NextResponse.json({
      leaderboards: enrichedLeaderboards,
      grouped: groupedLeaderboards,
      myRanks: userRanks,
      categories: LEADERBOARD_DISPLAY_CATEGORIES
    })
  } catch (error) {
    console.error("Failed to fetch leaderboards:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboards" }, { status: 500 })
  }
}

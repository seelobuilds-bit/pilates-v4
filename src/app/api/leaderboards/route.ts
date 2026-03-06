import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"
import {
  type EnrichedLeaderboard,
  loadEnrichedLeaderboards,
  loadViewerEntryByPeriodId,
} from "@/lib/leaderboards/query"
import {
  buildUserRanksByLeaderboardId,
  collectCurrentPeriodIds,
} from "@/lib/leaderboards/presentation"
import { buildWebLeaderboardsResponsePayload } from "@/lib/leaderboards/response"
import { buildDemoWebLeaderboardsPayload } from "@/lib/demo-leaderboards"
import { isDemoStudioId } from "@/lib/demo-studio"

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

  if (await isDemoStudioId(session.user.studioId)) {
    return NextResponse.json(
      await buildDemoWebLeaderboardsPayload({
        role: session.user.role,
        studioId: session.user.studioId,
        studioName: session.user.studioName,
        teacherId: session.user.teacherId,
      })
    )
  }

  try {
    if (process.env.LEADERBOARD_AUTO_CYCLE_ON_READ === "1") {
      try {
        await runLeaderboardAutoCycle()
      } catch (cycleError) {
        console.error("Leaderboard auto-cycle skipped due to error:", cycleError)
      }
    }

    const enrichedLeaderboards: EnrichedLeaderboard[] = await loadEnrichedLeaderboards({
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

    return NextResponse.json(
      buildWebLeaderboardsResponsePayload({
        leaderboards: enrichedLeaderboards,
        userRanks,
      })
    )
  } catch (error) {
    console.error("Failed to fetch leaderboards:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboards" }, { status: 500 })
  }
}

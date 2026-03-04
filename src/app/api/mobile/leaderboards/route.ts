import { NextRequest, NextResponse } from "next/server"
import { LeaderboardParticipantType } from "@prisma/client"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
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
import { buildMobileLeaderboardsResponsePayload } from "@/lib/leaderboards/response"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      if (auth.reason === "invalid_token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const decoded = auth.decoded

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Leaderboards are only available for studio and teacher accounts" }, { status: 403 })
    }

    try {
      await runLeaderboardAutoCycle()
    } catch (cycleError) {
      console.error("Mobile leaderboard auto-cycle skipped due to error:", cycleError)
    }

    const studio = auth.studio
    const studioSummary = toMobileStudioSummary(studio)

    const typeParam = String(request.nextUrl.searchParams.get("type") || "").toUpperCase()
    const participantType: LeaderboardParticipantType =
      typeParam === "TEACHER"
        ? "TEACHER"
        : decoded.role === "TEACHER"
          ? "TEACHER"
          : "STUDIO"
    const enriched: EnrichedLeaderboard[] = await loadEnrichedLeaderboards({
      participantType,
    })

    const viewerEntryByPeriodId = await loadViewerEntryByPeriodId({
      participantType,
      periodIds: collectCurrentPeriodIds(enriched),
      studioId: decoded.studioId,
      teacherId: decoded.teacherId,
    })
    const myRanks = buildUserRanksByLeaderboardId(enriched, viewerEntryByPeriodId)

    return NextResponse.json(
      buildMobileLeaderboardsResponsePayload({
        role: decoded.role,
        studio: studioSummary,
        participantType,
        leaderboards: enriched,
        myRanks,
      })
    )
  } catch (error) {
    console.error("Mobile leaderboards error:", error)
    return NextResponse.json({ error: "Failed to load leaderboards" }, { status: 500 })
  }
}

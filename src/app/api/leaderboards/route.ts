import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"
import {
  loadParticipantMapsForEntries,
  loadViewerEntryByPeriodId,
  resolveExpectedParticipantCountFromDb,
} from "@/lib/leaderboards/query"
import {
  attachParticipantsToEntries,
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

    const expectedParticipantCount = await resolveExpectedParticipantCountFromDb(participantType)

    // Get active leaderboards
    const leaderboards = await db.leaderboard.findMany({
      where: {
        isActive: true,
        participantType,
        ...(categoryFilter && { category: categoryFilter }),
        ...(featured && { isFeatured: true })
      },
      include: {
        prizes: {
          orderBy: { position: "asc" },
          take: 3
        },
        periods: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "desc" },
          take: 1,
          include: {
            entries: {
              orderBy: { score: "desc" },
              take: 10,
              select: {
                id: true,
                studioId: true,
                teacherId: true,
                score: true,
                rank: true,
                previousRank: true,
                lastUpdated: true
              }
            },
            _count: {
              select: { entries: true }
            }
          }
        }
      },
      orderBy: [
        { isFeatured: "desc" },
        { name: "asc" }
      ]
    })

    // Enrich entries with studio/teacher names
    const allEntries = leaderboards.flatMap((lb) => lb.periods[0]?.entries ?? [])
    const { studioById: studioParticipantById, teacherById: teacherParticipantById } =
      await loadParticipantMapsForEntries(allEntries)

    const enrichedLeaderboards = leaderboards.map((lb) => {
      const currentPeriod = lb.periods[0]
      if (!currentPeriod) {
        return { ...lb, currentPeriod: null }
      }

      const entries = attachParticipantsToEntries(currentPeriod.entries, {
        studioById: studioParticipantById,
        teacherById: teacherParticipantById,
      })

      return {
        ...lb,
        currentPeriod: {
          ...currentPeriod,
          entries,
          totalEntries: expectedParticipantCount
        }
      }
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

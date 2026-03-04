import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"
import {
  loadParticipantMapsForEntries,
  resolveExpectedParticipantCountFromDb,
} from "@/lib/leaderboards/query"
import {
  attachParticipantsToEntries,
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

    // Get user's rank in each leaderboard
    const userRanks: Record<string, { rank: number; score: number } | null> = {}
    const studioId = session.user.studioId
    const teacherId = session.user.teacherId

    const currentPeriods = enrichedLeaderboards
      .map((lb) => ({
        leaderboardId: lb.id,
        participantType: lb.participantType,
        periodId: lb.currentPeriod?.id ?? null
      }))
      .filter((item): item is { leaderboardId: string; participantType: LeaderboardParticipantType; periodId: string } =>
        Boolean(item.periodId)
      )

    const studioPeriodIds = currentPeriods
      .filter((item) => item.participantType === "STUDIO")
      .map((item) => item.periodId)
    const teacherPeriodIds = currentPeriods
      .filter((item) => item.participantType === "TEACHER")
      .map((item) => item.periodId)

    const [studioEntries, teacherEntries] = await Promise.all([
      studioId && studioPeriodIds.length
        ? db.leaderboardEntry.findMany({
            where: {
              periodId: { in: studioPeriodIds },
              studioId
            },
            select: { periodId: true, rank: true, score: true }
          })
        : Promise.resolve([]),
      teacherId && teacherPeriodIds.length
        ? db.leaderboardEntry.findMany({
            where: {
              periodId: { in: teacherPeriodIds },
              teacherId
            },
            select: { periodId: true, rank: true, score: true }
          })
        : Promise.resolve([])
    ])

    const studioEntryByPeriod = new Map(studioEntries.map((entry) => [entry.periodId, entry]))
    const teacherEntryByPeriod = new Map(teacherEntries.map((entry) => [entry.periodId, entry]))

    for (const lb of enrichedLeaderboards) {
      if (!lb.currentPeriod) {
        userRanks[lb.id] = null
        continue
      }

      const matchedEntry =
        lb.participantType === "STUDIO"
          ? studioEntryByPeriod.get(lb.currentPeriod.id)
          : teacherEntryByPeriod.get(lb.currentPeriod.id)

      if (!matchedEntry || !matchedEntry.rank || matchedEntry.rank <= 0) {
        userRanks[lb.id] = null
        continue
      }

      userRanks[lb.id] = {
        rank: matchedEntry.rank,
        score: matchedEntry.score
      }
    }

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

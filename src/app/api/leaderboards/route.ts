import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"

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
    const studioIds = Array.from(
      new Set(allEntries.map((entry) => entry.studioId).filter((id): id is string => Boolean(id)))
    )
    const teacherIds = Array.from(
      new Set(allEntries.map((entry) => entry.teacherId).filter((id): id is string => Boolean(id)))
    )

    const [studios, teachers] = await Promise.all([
      studioIds.length
        ? db.studio.findMany({
            where: { id: { in: studioIds } },
            select: { id: true, name: true, subdomain: true }
          })
        : Promise.resolve([]),
      teacherIds.length
        ? db.teacher.findMany({
            where: { id: { in: teacherIds } },
            select: {
              id: true,
              studioId: true,
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          })
        : Promise.resolve([])
    ])

    const studioParticipantById = new Map(
      studios.map((studio) => [studio.id, { id: studio.id, name: studio.name, subdomain: studio.subdomain }])
    )
    const teacherParticipantById = new Map(
      teachers.map((teacher) => [
        teacher.id,
        {
          id: teacher.id,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          studioId: teacher.studioId
        }
      ])
    )

    const enrichedLeaderboards = leaderboards.map((lb) => {
      const currentPeriod = lb.periods[0]
      if (!currentPeriod) {
        return { ...lb, currentPeriod: null }
      }

      const entries = currentPeriod.entries.map((entry) => {
        const participant = entry.studioId
          ? (studioParticipantById.get(entry.studioId) ?? null)
          : entry.teacherId
            ? (teacherParticipantById.get(entry.teacherId) ?? null)
            : null
        return { ...entry, participant }
      })

      return {
        ...lb,
        currentPeriod: {
          ...currentPeriod,
          entries,
          totalEntries: currentPeriod._count.entries
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
    const categories = [
      { id: "content", name: "Content & Social", icon: "Share2" },
      { id: "growth", name: "Growth", icon: "TrendingUp" },
      { id: "courses", name: "Courses & Vault", icon: "BookOpen" },
      { id: "bookings", name: "Bookings & Classes", icon: "Calendar" },
      { id: "engagement", name: "Engagement", icon: "Heart" },
      { id: "special", name: "Special", icon: "Award" }
    ]

    const categoryMap: Record<string, string> = {
      MOST_CONTENT_POSTED: "content",
      MOST_SOCIAL_VIEWS: "content",
      MOST_SOCIAL_LIKES: "content",
      MOST_SOCIAL_ENGAGEMENT: "content",
      CONTENT_CONSISTENCY: "content",
      FASTEST_GROWING: "growth",
      BIGGEST_GROWTH_MONTHLY: "growth",
      BIGGEST_GROWTH_QUARTERLY: "growth",
      MOST_NEW_CLIENTS: "growth",
      HIGHEST_RETENTION: "growth",
      MOST_COURSES_COMPLETED: "courses",
      MOST_COURSE_ENROLLMENTS: "courses",
      TOP_COURSE_CREATOR: "courses",
      BEST_COURSE_RATINGS: "courses",
      MOST_BOOKINGS: "bookings",
      HIGHEST_ATTENDANCE_RATE: "bookings",
      MOST_CLASSES_TAUGHT: "bookings",
      TOP_REVENUE: "bookings",
      MOST_ACTIVE_COMMUNITY: "engagement",
      TOP_REVIEWER: "engagement",
      MOST_REFERRALS: "engagement",
      NEWCOMER_OF_MONTH: "special",
      COMEBACK_CHAMPION: "special",
      ALL_ROUNDER: "special"
    }

    const groupedLeaderboards = categories.map(cat => ({
      ...cat,
      leaderboards: enrichedLeaderboards.filter(
        lb => categoryMap[lb.category] === cat.id
      )
    })).filter(cat => cat.leaderboards.length > 0)

    return NextResponse.json({
      leaderboards: enrichedLeaderboards,
      grouped: groupedLeaderboards,
      myRanks: userRanks,
      categories
    })
  } catch (error) {
    console.error("Failed to fetch leaderboards:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboards" }, { status: 500 })
  }
}













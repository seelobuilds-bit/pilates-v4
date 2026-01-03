import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch leaderboards for studios/teachers
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const participantType = searchParams.get("type") || "STUDIO" // STUDIO or TEACHER
  const category = searchParams.get("category")
  const featured = searchParams.get("featured") === "true"

  try {
    // Get active leaderboards
    const leaderboards = await db.leaderboard.findMany({
      where: {
        isActive: true,
        participantType: participantType as "STUDIO" | "TEACHER",
        ...(category && { category: category as any }),
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
    const enrichedLeaderboards = await Promise.all(
      leaderboards.map(async (lb) => {
        try {
          const currentPeriod = lb.periods[0]
          if (!currentPeriod) return { ...lb, currentPeriod: null }

          const entries = await Promise.all(
            currentPeriod.entries.map(async (entry) => {
              try {
                let participant = null
                if (entry.studioId) {
                  participant = await db.studio.findUnique({
                    where: { id: entry.studioId },
                    select: { id: true, name: true, subdomain: true }
                  })
                } else if (entry.teacherId) {
                  const teacher = await db.teacher.findUnique({
                    where: { id: entry.teacherId },
                    include: { user: { select: { firstName: true, lastName: true } } }
                  })
                  if (teacher) {
                    participant = {
                      id: teacher.id,
                      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
                      studioId: teacher.studioId
                    }
                  }
                }
                return { ...entry, participant }
              } catch (e) {
                console.error("Error enriching entry:", e)
                return { ...entry, participant: null }
              }
            })
          )

          return {
            ...lb,
            currentPeriod: {
              ...currentPeriod,
              entries,
              totalEntries: currentPeriod._count.entries
            }
          }
        } catch (e) {
          console.error("Error enriching leaderboard:", e)
          return { ...lb, currentPeriod: null }
        }
      })
    )

    // Get user's rank in each leaderboard
    const userRanks: Record<string, { rank: number; score: number } | null> = {}
    const studioId = session.user.studioId
    const teacherId = session.user.teacherId

    for (const lb of enrichedLeaderboards) {
      if (!lb.currentPeriod) continue
      
      const myEntry = await db.leaderboardEntry.findFirst({
        where: {
          periodId: lb.currentPeriod.id,
          ...(lb.participantType === "STUDIO" ? { studioId } : { teacherId })
        },
        select: { rank: true, score: true }
      })

      userRanks[lb.id] = myEntry ? { rank: myEntry.rank || 0, score: myEntry.score } : null
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













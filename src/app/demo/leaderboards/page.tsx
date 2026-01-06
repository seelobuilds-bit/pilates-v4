import { db } from "@/lib/db"
import { LeaderboardsView } from "@/components/studio"
import type { LeaderboardData, Leaderboard as LeaderboardType, LeaderboardEntry } from "@/components/studio"

// Demo uses data from a real studio (Zenith) to always reflect the current state
const DEMO_STUDIO_SUBDOMAIN = "zenith"

export default async function DemoLeaderboardsPage() {
  // Find the demo studio (to show their rankings)
  const studio = await db.studio.findFirst({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN }
  })

  if (!studio) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Not Available</h1>
          <p className="text-gray-500">The demo studio has not been set up yet.</p>
        </div>
      </div>
    )
  }

  // Fetch all leaderboards with their current period and entries
  const allLeaderboards = await db.leaderboard.findMany({
    where: { isActive: true },
    include: {
      prizes: {
        orderBy: { position: "asc" }
      },
      periods: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { startDate: "desc" },
        include: {
          entries: {
            orderBy: { rank: "asc" },
            take: 10,
            include: {
              // Note: These are optional, they might be null
            }
          }
        }
      }
    },
    orderBy: [
      { isFeatured: "desc" },
      { createdAt: "desc" }
    ]
  })

  // Fetch studio names and teacher names separately for entry lookups
  const studioIds = new Set<string>()
  const teacherIds = new Set<string>()
  
  allLeaderboards.forEach(lb => {
    lb.periods[0]?.entries.forEach(e => {
      if (e.studioId) studioIds.add(e.studioId)
      if (e.teacherId) teacherIds.add(e.teacherId)
    })
  })

  const [studios, teacherUsers] = await Promise.all([
    studioIds.size > 0 
      ? db.studio.findMany({ where: { id: { in: Array.from(studioIds) } }, select: { id: true, name: true } })
      : [],
    teacherIds.size > 0
      ? db.teacher.findMany({ 
          where: { id: { in: Array.from(teacherIds) } },
          include: { user: { select: { firstName: true, lastName: true } } }
        })
      : []
  ])

  const studioMap = new Map(studios.map(s => [s.id, s.name]))
  const teacherMap = new Map(teacherUsers.map(t => [t.id, `${t.user.firstName} ${t.user.lastName}`]))

  // Fetch badges
  const badges = await db.leaderboardBadge.findMany({
    include: {
      _count: {
        select: { earnedBadges: true }
      }
    }
  })

  // Get my rankings (for the demo studio) - need to get from all active periods
  const activePeriodIds = allLeaderboards
    .filter(lb => lb.periods[0])
    .map(lb => lb.periods[0]!.id)

  const myEntries = activePeriodIds.length > 0 
    ? await db.leaderboardEntry.findMany({
        where: {
          studioId: studio.id,
          periodId: { in: activePeriodIds }
        },
        include: {
          period: { select: { leaderboardId: true } }
        }
      })
    : []

  const myRanks: Record<string, { rank: number; score: number }> = {}
  myEntries.forEach(e => {
    if (e.rank !== null) {
      myRanks[e.period.leaderboardId] = { rank: e.rank, score: Number(e.score) }
    }
  })

  // Separate studio and teacher leaderboards
  const studioLeaderboards = allLeaderboards.filter(lb => lb.participantType === "STUDIO")
  const teacherLeaderboards = allLeaderboards.filter(lb => lb.participantType === "TEACHER")

  const mapLeaderboard = (lb: typeof allLeaderboards[0]): LeaderboardType => {
    const currentPeriod = lb.periods[0]
    const entries: LeaderboardEntry[] = currentPeriod?.entries.map(e => ({
      id: e.id,
      rank: e.rank ?? 0,
      previousRank: e.previousRank,
      score: Number(e.score),
      participantName: e.studioId 
        ? (studioMap.get(e.studioId) || "Unknown Studio")
        : e.teacherId 
          ? (teacherMap.get(e.teacherId) || "Unknown Teacher")
          : "Unknown"
    })) || []

    return {
      id: lb.id,
      name: lb.name,
      slug: lb.slug,
      description: lb.description,
      category: lb.category,
      participantType: lb.participantType,
      timeframe: lb.timeframe,
      metricName: lb.metricName,
      metricUnit: lb.metricUnit,
      icon: lb.icon,
      color: lb.color,
      isFeatured: lb.isFeatured,
      prizes: lb.prizes.map(p => ({
        id: p.id,
        position: p.position,
        name: p.name,
        description: p.description,
        prizeType: p.prizeType,
        prizeValue: p.prizeValue ? Number(p.prizeValue) : null
      })),
      entries,
      totalEntries: currentPeriod?.entries.length || 0
    }
  }

  const leaderboardData: LeaderboardData = {
    studioLeaderboards: studioLeaderboards.map(mapLeaderboard),
    teacherLeaderboards: teacherLeaderboards.map(mapLeaderboard),
    myRanks,
    badges: badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description || "",
      icon: b.imageUrl || "🏆", // Use imageUrl as fallback for icon display
      earnedCount: b._count.earnedBadges
    }))
  }

  return <LeaderboardsView data={leaderboardData} linkPrefix="/demo" />
}




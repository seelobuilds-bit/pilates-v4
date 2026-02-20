import { NextRequest, NextResponse } from "next/server"
import { LeaderboardParticipantType } from "@prisma/client"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Leaderboards are only available for studio and teacher accounts" }, { status: 403 })
    }

    try {
      await runLeaderboardAutoCycle()
    } catch (cycleError) {
      console.error("Mobile leaderboard auto-cycle skipped due to error:", cycleError)
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const typeParam = String(request.nextUrl.searchParams.get("type") || "").toUpperCase()
    const participantType: LeaderboardParticipantType =
      typeParam === "TEACHER"
        ? "TEACHER"
        : decoded.role === "TEACHER"
          ? "TEACHER"
          : "STUDIO"

    const leaderboards = await db.leaderboard.findMany({
      where: {
        isActive: true,
        participantType,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        participantType: true,
        timeframe: true,
        metricName: true,
        metricUnit: true,
        color: true,
        icon: true,
        isFeatured: true,
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
                lastUpdated: true,
              },
            },
            _count: {
              select: { entries: true },
            },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    })

    const allEntries = leaderboards.flatMap((leaderboard) => leaderboard.periods[0]?.entries ?? [])
    const studioIds = Array.from(new Set(allEntries.map((entry) => entry.studioId).filter((id): id is string => Boolean(id))))
    const teacherIds = Array.from(new Set(allEntries.map((entry) => entry.teacherId).filter((id): id is string => Boolean(id))))

    const [studios, teachers] = await Promise.all([
      studioIds.length
        ? db.studio.findMany({
            where: { id: { in: studioIds } },
            select: { id: true, name: true, subdomain: true },
          })
        : Promise.resolve([]),
      teacherIds.length
        ? db.teacher.findMany({
            where: { id: { in: teacherIds } },
            select: {
              id: true,
              studioId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ])

    const studioById = new Map(studios.map((item) => [item.id, { id: item.id, name: item.name, subdomain: item.subdomain }]))
    const teacherById = new Map(
      teachers.map((item) => [
        item.id,
        {
          id: item.id,
          name: `${item.user.firstName} ${item.user.lastName}`,
          studioId: item.studioId,
        },
      ])
    )

    const enriched = leaderboards.map((leaderboard) => {
      const currentPeriod = leaderboard.periods[0]
      if (!currentPeriod) {
        return {
          ...leaderboard,
          currentPeriod: null,
        }
      }

      return {
        ...leaderboard,
        currentPeriod: {
          id: currentPeriod.id,
          name: currentPeriod.name,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
          totalEntries: currentPeriod._count.entries,
          entries: currentPeriod.entries.map((entry) => ({
            ...entry,
            participant: entry.studioId
              ? (studioById.get(entry.studioId) ?? null)
              : entry.teacherId
                ? (teacherById.get(entry.teacherId) ?? null)
                : null,
          })),
        },
      }
    })

    const currentPeriodIds = enriched
      .map((leaderboard) => leaderboard.currentPeriod?.id)
      .filter((id): id is string => Boolean(id))

    const myEntries = await db.leaderboardEntry.findMany({
      where: {
        periodId: { in: currentPeriodIds },
        ...(participantType === "STUDIO" ? { studioId: decoded.studioId } : { teacherId: decoded.teacherId || "__missing_teacher__" }),
      },
      select: {
        periodId: true,
        rank: true,
        score: true,
      },
    })

    const myEntryByPeriod = new Map(myEntries.map((entry) => [entry.periodId, entry]))

    const myRanks: Record<string, { rank: number; score: number } | null> = {}
    for (const leaderboard of enriched) {
      const currentPeriod = leaderboard.currentPeriod
      if (!currentPeriod) {
        myRanks[leaderboard.id] = null
        continue
      }

      const entry = myEntryByPeriod.get(currentPeriod.id)
      if (!entry || !entry.rank || entry.rank <= 0) {
        myRanks[leaderboard.id] = null
        continue
      }

      myRanks[leaderboard.id] = {
        rank: entry.rank,
        score: entry.score,
      }
    }

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      participantType,
      leaderboards: enriched.map((leaderboard) => ({
        id: leaderboard.id,
        name: leaderboard.name,
        description: leaderboard.description,
        category: leaderboard.category,
        participantType: leaderboard.participantType,
        timeframe: leaderboard.timeframe,
        metricName: leaderboard.metricName,
        metricUnit: leaderboard.metricUnit,
        color: leaderboard.color,
        icon: leaderboard.icon,
        isFeatured: leaderboard.isFeatured,
        currentPeriod: leaderboard.currentPeriod
          ? {
              id: leaderboard.currentPeriod.id,
              name: leaderboard.currentPeriod.name,
              startDate: leaderboard.currentPeriod.startDate.toISOString(),
              endDate: leaderboard.currentPeriod.endDate.toISOString(),
              totalEntries: leaderboard.currentPeriod.totalEntries,
              entries: leaderboard.currentPeriod.entries.map((entry) => ({
                id: entry.id,
                studioId: entry.studioId,
                teacherId: entry.teacherId,
                score: entry.score,
                rank: entry.rank,
                previousRank: entry.previousRank,
                lastUpdated: entry.lastUpdated.toISOString(),
                participant: entry.participant,
              })),
            }
          : null,
      })),
      myRanks,
    })
  } catch (error) {
    console.error("Mobile leaderboards error:", error)
    return NextResponse.json({ error: "Failed to load leaderboards" }, { status: 500 })
  }
}

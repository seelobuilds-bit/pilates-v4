import { NextRequest, NextResponse } from "next/server"
import { LeaderboardParticipantType } from "@prisma/client"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"
import {
  loadParticipantMapsForEntries,
  resolveExpectedParticipantCountFromDb,
} from "@/lib/leaderboards/query"
import {
  attachParticipantToEntry,
} from "@/lib/leaderboards/presentation"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaderboardId: string }> }
) {
  try {
    const resolvedParams = await params
    const leaderboardId = resolvedParams.leaderboardId

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

    if (decoded.role === "TEACHER" && !decoded.teacherId) {
      return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
    }

    try {
      await runLeaderboardAutoCycle({
        leaderboardId,
      })
    } catch (cycleError) {
      console.error("Mobile leaderboard detail auto-cycle skipped due to error:", cycleError)
    }

    const studio = auth.studio

    const leaderboard = await db.leaderboard.findFirst({
      where: {
        id: leaderboardId,
        isActive: true,
        ...(decoded.role === "TEACHER" ? { participantType: LeaderboardParticipantType.TEACHER } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        participantType: true,
        timeframe: true,
        metricName: true,
        metricUnit: true,
        higherIsBetter: true,
        minimumEntries: true,
        icon: true,
        color: true,
        isFeatured: true,
        lastCalculated: true,
        prizes: {
          orderBy: { position: "asc" },
          take: 5,
          select: {
            id: true,
            position: true,
            name: true,
            description: true,
            prizeType: true,
            prizeValue: true,
            prizeCurrency: true,
            imageUrl: true,
            sponsorName: true,
          },
        },
      },
    })

    if (!leaderboard) {
      return NextResponse.json({ error: "Leaderboard not found" }, { status: 404 })
    }

    const rankSortDirection = leaderboard.higherIsBetter ? "desc" : "asc"
    const [activePeriod, recentPeriods] = await Promise.all([
      db.leaderboardPeriod.findFirst({
        where: {
          leaderboardId: leaderboard.id,
          status: "ACTIVE",
        },
        orderBy: {
          startDate: "desc",
        },
        include: {
          entries: {
            orderBy: [{ rank: "asc" }, { score: rankSortDirection }],
            take: 30,
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
            select: {
              entries: true,
            },
          },
        },
      }),
      db.leaderboardPeriod.findMany({
        where: {
          leaderboardId: leaderboard.id,
        },
        orderBy: {
          startDate: "desc",
        },
        take: 6,
        include: {
          entries: {
            orderBy: [{ rank: "asc" }, { score: rankSortDirection }],
            take: 3,
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
            select: {
              entries: true,
            },
          },
        },
      }),
    ])

    const entryParticipantRows = [
      ...(activePeriod?.entries ?? []),
      ...recentPeriods.flatMap((period) => period.entries),
    ]
    const { studioById, teacherById } = await loadParticipantMapsForEntries(entryParticipantRows)
    const expectedParticipantCount = await resolveExpectedParticipantCountFromDb(
      leaderboard.participantType
    )

    const enrichEntry = (entry: {
      id: string
      studioId: string | null
      teacherId: string | null
      score: number
      rank: number | null
      previousRank: number | null
      lastUpdated: Date
    }) => {
      const enriched = attachParticipantToEntry(
        {
          id: entry.id,
          studioId: entry.studioId,
          teacherId: entry.teacherId,
          score: entry.score,
          rank: entry.rank,
          previousRank: entry.previousRank,
          lastUpdated: entry.lastUpdated.toISOString(),
        },
        {
          studioById,
          teacherById,
        }
      )

      return enriched.participant ? enriched : null
    }

    const myEntry =
      activePeriod &&
      (await db.leaderboardEntry.findFirst({
        where: {
          periodId: activePeriod.id,
          ...(leaderboard.participantType === "STUDIO"
            ? { studioId: decoded.studioId }
            : { teacherId: decoded.teacherId || "__missing_teacher__" }),
        },
        select: {
          id: true,
          studioId: true,
          teacherId: true,
          score: true,
          rank: true,
          previousRank: true,
          lastUpdated: true,
        },
      }))

    const activeAggregate =
      activePeriod &&
      (await db.leaderboardEntry.aggregate({
        where: {
          periodId: activePeriod.id,
        },
        _count: {
          _all: true,
        },
        _avg: {
          score: true,
        },
        _max: {
          score: true,
        },
        _min: {
          score: true,
        },
      }))

    return NextResponse.json({
      role: decoded.role,
      studio: toMobileStudioSummary(studio),
      leaderboard: {
        id: leaderboard.id,
        name: leaderboard.name,
        slug: leaderboard.slug,
        description: leaderboard.description,
        category: leaderboard.category,
        participantType: leaderboard.participantType,
        timeframe: leaderboard.timeframe,
        metricName: leaderboard.metricName,
        metricUnit: leaderboard.metricUnit,
        higherIsBetter: leaderboard.higherIsBetter,
        minimumEntries: leaderboard.minimumEntries,
        icon: leaderboard.icon,
        color: leaderboard.color,
        isFeatured: leaderboard.isFeatured,
        lastCalculated: leaderboard.lastCalculated?.toISOString() || null,
        prizes: leaderboard.prizes.map((prize) => ({
          id: prize.id,
          position: prize.position,
          name: prize.name,
          description: prize.description,
          prizeType: prize.prizeType,
          prizeValue: prize.prizeValue,
          prizeCurrency: prize.prizeCurrency,
          imageUrl: prize.imageUrl,
          sponsorName: prize.sponsorName,
        })),
      },
      activePeriod: activePeriod
        ? {
            id: activePeriod.id,
            name: activePeriod.name,
            status: activePeriod.status,
            startDate: activePeriod.startDate.toISOString(),
            endDate: activePeriod.endDate.toISOString(),
            totalEntries: expectedParticipantCount,
            entries: activePeriod.entries.map(enrichEntry).filter(Boolean),
          }
        : null,
      myEntry: myEntry ? enrichEntry(myEntry) : null,
      recentPeriods: recentPeriods.map((period) => ({
        id: period.id,
        name: period.name,
        status: period.status,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        totalEntries: expectedParticipantCount,
        entries: period.entries.map(enrichEntry).filter(Boolean),
      })),
      stats: {
        trackedPeriods: recentPeriods.length,
        activeTopScore: activeAggregate
          ? leaderboard.higherIsBetter
            ? (activeAggregate._max.score ?? null)
            : (activeAggregate._min.score ?? null)
          : null,
        activeAverageScore: activeAggregate?._avg.score ?? null,
        myRank: myEntry?.rank ?? null,
        myScore: myEntry?.score ?? null,
      },
    })
  } catch (error) {
    console.error("Mobile leaderboard detail error:", error)
    return NextResponse.json({ error: "Failed to load leaderboard detail" }, { status: 500 })
  }
}

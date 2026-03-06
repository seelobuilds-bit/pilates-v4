import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"
import { db } from "@/lib/db"
import { getDemoStudioId, getDemoTeacherIds } from "@/lib/demo-studio"
import { enrichLeaderboardRowsWithParticipants } from "./enrichment"
import {
  collectEntryParticipantIds,
  createStudioParticipantMap,
  createTeacherParticipantMap,
  resolveExpectedParticipantCount,
} from "./presentation"

type LeaderboardEntryParticipantRef = {
  studioId: string | null
  teacherId: string | null
}

type LeaderboardParticipant =
  | {
      id: string
      name: string
      subdomain?: string
      studioId?: string
    }
  | null

export type EnrichedLeaderboardEntry = {
  id: string
  studioId: string | null
  teacherId: string | null
  score: number
  rank: number | null
  previousRank: number | null
  lastUpdated: Date
  participant: LeaderboardParticipant
}

export type EnrichedLeaderboardPeriod = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  totalEntries: number
  entries: EnrichedLeaderboardEntry[]
}

export type EnrichedLeaderboard = {
  id: string
  name: string
  description: string | null
  category: LeaderboardCategory
  participantType: LeaderboardParticipantType
  timeframe: string
  metricName: string
  metricUnit: string | null
  color: string | null
  icon: string | null
  isFeatured: boolean
  prizes: unknown[]
  currentPeriod: EnrichedLeaderboardPeriod | null
}

export async function resolveExpectedParticipantCountFromDb(
  participantType: LeaderboardParticipantType
) {
  const [demoStudioId, demoTeacherIds] = await Promise.all([getDemoStudioId(), getDemoTeacherIds()])
  const [studioCount, teacherCount] = await Promise.all([
    db.studio.count({
      where: demoStudioId
        ? {
            id: {
              not: demoStudioId,
            },
          }
        : undefined,
    }),
    db.teacher.count({
      where: {
        isActive: true,
        ...(demoTeacherIds.length ? { id: { notIn: demoTeacherIds } } : {}),
      },
    }),
  ])

  return resolveExpectedParticipantCount(participantType, {
    studioCount,
    teacherCount,
  })
}

export async function loadParticipantMapsForEntries(entries: LeaderboardEntryParticipantRef[]) {
  const { studioIds, teacherIds } = collectEntryParticipantIds(entries)
  const [demoStudioId, demoTeacherIds] = await Promise.all([getDemoStudioId(), getDemoTeacherIds()])
  const filteredStudioIds = demoStudioId ? studioIds.filter((id) => id !== demoStudioId) : studioIds
  const filteredTeacherIds = demoTeacherIds.length
    ? teacherIds.filter((id) => !demoTeacherIds.includes(id))
    : teacherIds

  const [studios, teachers] = await Promise.all([
    filteredStudioIds.length
      ? db.studio.findMany({
          where: { id: { in: filteredStudioIds } },
          select: { id: true, name: true, subdomain: true },
        })
      : Promise.resolve([]),
    filteredTeacherIds.length
      ? db.teacher.findMany({
          where: { id: { in: filteredTeacherIds } },
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

  return {
    studioById: createStudioParticipantMap(studios),
    teacherById: createTeacherParticipantMap(
      teachers.map((teacher) => ({
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        studioId: teacher.studioId,
      }))
    ),
  }
}

export async function loadEnrichedLeaderboards(args: {
  participantType: LeaderboardParticipantType
  categoryFilter?: LeaderboardCategory | null
  featuredOnly?: boolean
  includePrizes?: boolean
}): Promise<EnrichedLeaderboard[]> {
  const {
    participantType,
    categoryFilter = null,
    featuredOnly = false,
    includePrizes = false,
  } = args

  const [expectedParticipantCount, demoStudioId, demoTeacherIds] = await Promise.all([
    resolveExpectedParticipantCountFromDb(participantType),
    getDemoStudioId(),
    getDemoTeacherIds(),
  ])

  const leaderboards = await db.leaderboard.findMany({
    where: {
      isActive: true,
      participantType,
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(featuredOnly ? { isFeatured: true } : {}),
    },
    include: {
      prizes: {
        orderBy: { position: "asc" as const },
        take: 3,
      },
      periods: {
        where: { status: "ACTIVE" as const },
        orderBy: { startDate: "desc" as const },
        take: 1,
        include: {
          entries: {
            where:
              participantType === "STUDIO"
                ? demoStudioId
                  ? {
                      studioId: {
                        not: demoStudioId,
                      },
                    }
                  : undefined
                : demoTeacherIds.length
                  ? {
                      teacherId: {
                        notIn: demoTeacherIds,
                      },
                    }
                  : undefined,
            orderBy: { score: "desc" as const },
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
    orderBy: [{ isFeatured: "desc" as const }, { name: "asc" as const }],
  })

  const allEntries = leaderboards.flatMap((leaderboard) => leaderboard.periods[0]?.entries ?? [])
  const participantMaps = await loadParticipantMapsForEntries(allEntries)
  const enriched = enrichLeaderboardRowsWithParticipants({
    leaderboards,
    expectedParticipantCount,
    participantMaps,
  })

  return enriched.map((leaderboard) => {
    const currentPeriod = leaderboard.currentPeriod
    return {
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
      prizes: includePrizes ? leaderboard.prizes : [],
      currentPeriod: currentPeriod
        ? {
            id: currentPeriod.id,
            name: currentPeriod.name,
            startDate: currentPeriod.startDate,
            endDate: currentPeriod.endDate,
            totalEntries: currentPeriod.totalEntries,
            entries: currentPeriod.entries as EnrichedLeaderboardEntry[],
          }
        : null,
    }
  })
}

export async function loadViewerEntryByPeriodId(params: {
  participantType: LeaderboardParticipantType
  periodIds: string[]
  studioId?: string | null
  teacherId?: string | null
}) {
  const { participantType, periodIds, studioId, teacherId } = params
  if (!periodIds.length) return new Map<string, { rank: number | null; score: number }>()
  if (participantType === "STUDIO" && !studioId) return new Map<string, { rank: number | null; score: number }>()
  if (participantType === "TEACHER" && !teacherId) return new Map<string, { rank: number | null; score: number }>()

  const entries = await db.leaderboardEntry.findMany({
    where: {
      periodId: { in: periodIds },
      ...(participantType === "STUDIO" ? { studioId: studioId as string } : { teacherId: teacherId as string }),
    },
    select: {
      periodId: true,
      rank: true,
      score: true,
    },
  })

  return new Map(entries.map((entry) => [entry.periodId, { rank: entry.rank, score: entry.score }]))
}

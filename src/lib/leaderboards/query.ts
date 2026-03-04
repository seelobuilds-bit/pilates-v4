import { LeaderboardParticipantType } from "@prisma/client"
import { db } from "@/lib/db"
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

export async function resolveExpectedParticipantCountFromDb(
  participantType: LeaderboardParticipantType
) {
  const [studioCount, teacherCount] = await Promise.all([
    db.studio.count(),
    db.teacher.count({ where: { isActive: true } }),
  ])

  return resolveExpectedParticipantCount(participantType, {
    studioCount,
    teacherCount,
  })
}

export async function loadParticipantMapsForEntries(entries: LeaderboardEntryParticipantRef[]) {
  const { studioIds, teacherIds } = collectEntryParticipantIds(entries)

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

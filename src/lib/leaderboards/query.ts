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

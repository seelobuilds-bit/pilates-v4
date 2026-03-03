import { LeaderboardParticipantType } from "@prisma/client"

type ParticipantEntry = {
  id: string
  studioId: string | null
  teacherId: string | null
}

type StudioParticipantRow = {
  id: string
  name: string
  subdomain?: string | null
}

type TeacherParticipantRow = {
  id: string
  name: string
  studioId?: string | null
}

export function resolveExpectedParticipantCount(
  participantType: LeaderboardParticipantType,
  counts: { studioCount: number; teacherCount: number }
) {
  return participantType === "STUDIO" ? counts.studioCount : counts.teacherCount
}

export function compareLeaderboardEntries(
  left: { id: string; score: number },
  right: { id: string; score: number },
  higherIsBetter: boolean
) {
  if (higherIsBetter) {
    if (left.score !== right.score) return right.score - left.score
  } else if (left.score !== right.score) {
    return left.score - right.score
  }

  return left.id.localeCompare(right.id)
}

export function createStudioParticipantMap(rows: StudioParticipantRow[]) {
  return new Map(
    rows.map((studio) => [
      studio.id,
      {
        id: studio.id,
        name: studio.name,
        ...(typeof studio.subdomain === "string" ? { subdomain: studio.subdomain } : {}),
      },
    ])
  )
}

export function createTeacherParticipantMap(rows: TeacherParticipantRow[]) {
  return new Map(
    rows.map((teacher) => [
      teacher.id,
      {
        id: teacher.id,
        name: teacher.name,
        ...(typeof teacher.studioId === "string" ? { studioId: teacher.studioId } : {}),
      },
    ])
  )
}

export function attachParticipantsToEntries<T extends ParticipantEntry>(
  entries: T[],
  participantMaps: {
    studioById: Map<string, { id: string; name: string; subdomain?: string }>
    teacherById: Map<string, { id: string; name: string; studioId?: string }>
  }
) {
  return entries
    .map((entry) => {
      const participant = entry.studioId
        ? (participantMaps.studioById.get(entry.studioId) ?? null)
        : entry.teacherId
          ? (participantMaps.teacherById.get(entry.teacherId) ?? null)
          : null

      return {
        ...entry,
        participant,
      }
    })
    .filter((entry) => Boolean(entry.participant))
}


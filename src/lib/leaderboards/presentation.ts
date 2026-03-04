import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"

type ParticipantRef = {
  studioId: string | null
  teacherId: string | null
}

type ParticipantMaps = {
  studioById: Map<string, { id: string; name: string; subdomain?: string }>
  teacherById: Map<string, { id: string; name: string; studioId?: string }>
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

type LeaderboardDisplayCategory = {
  id: string
  name: string
  icon: string
}

type LeaderboardWithCategory = {
  category: LeaderboardCategory
}

type CurrentPeriodRef = {
  id: string
}

type LeaderboardWithCurrentPeriod = {
  id: string
  currentPeriod: CurrentPeriodRef | null
}

export const LEADERBOARD_DISPLAY_CATEGORIES: LeaderboardDisplayCategory[] = [
  { id: "content", name: "Content & Social", icon: "Share2" },
  { id: "growth", name: "Growth", icon: "TrendingUp" },
  { id: "courses", name: "Courses & Vault", icon: "BookOpen" },
  { id: "bookings", name: "Bookings & Classes", icon: "Calendar" },
  { id: "engagement", name: "Engagement", icon: "Heart" },
  { id: "special", name: "Special", icon: "Award" },
]

const LEADERBOARD_CATEGORY_DISPLAY_MAP: Record<LeaderboardCategory, string> = {
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
  ALL_ROUNDER: "special",
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

export function attachParticipantsToEntries<T extends ParticipantRef>(
  entries: T[],
  participantMaps: ParticipantMaps
) {
  return entries
    .map((entry) => attachParticipantToEntry(entry, participantMaps))
    .filter((entry) => Boolean(entry.participant))
}

export function attachParticipantToEntry<T extends ParticipantRef>(
  entry: T,
  participantMaps: ParticipantMaps
) {
  const participant = entry.studioId
    ? (participantMaps.studioById.get(entry.studioId) ?? null)
    : entry.teacherId
      ? (participantMaps.teacherById.get(entry.teacherId) ?? null)
      : null

  return {
    ...entry,
    participant,
  }
}

export function collectEntryParticipantIds<T extends ParticipantRef>(entries: T[]) {
  return {
    studioIds: Array.from(
      new Set(entries.map((entry) => entry.studioId).filter((id): id is string => Boolean(id)))
    ),
    teacherIds: Array.from(
      new Set(entries.map((entry) => entry.teacherId).filter((id): id is string => Boolean(id)))
    ),
  }
}

export function resolveLeaderboardDisplayCategoryId(category: LeaderboardCategory) {
  return LEADERBOARD_CATEGORY_DISPLAY_MAP[category]
}

export function groupLeaderboardsByDisplayCategory<T extends LeaderboardWithCategory>(
  leaderboards: T[]
) {
  return LEADERBOARD_DISPLAY_CATEGORIES.map((category) => ({
    ...category,
    leaderboards: leaderboards.filter(
      (leaderboard) => resolveLeaderboardDisplayCategoryId(leaderboard.category) === category.id
    ),
  })).filter((category) => category.leaderboards.length > 0)
}

export function collectCurrentPeriodIds<T extends LeaderboardWithCurrentPeriod>(leaderboards: T[]) {
  return leaderboards
    .map((leaderboard) => leaderboard.currentPeriod?.id)
    .filter((id): id is string => Boolean(id))
}

export function buildUserRanksByLeaderboardId<T extends LeaderboardWithCurrentPeriod>(
  leaderboards: T[],
  viewerEntryByPeriodId: Map<string, { rank: number | null; score: number }>
) {
  const ranks: Record<string, { rank: number; score: number } | null> = {}

  for (const leaderboard of leaderboards) {
    const currentPeriod = leaderboard.currentPeriod
    if (!currentPeriod) {
      ranks[leaderboard.id] = null
      continue
    }

    const entry = viewerEntryByPeriodId.get(currentPeriod.id)
    if (!entry || !entry.rank || entry.rank <= 0) {
      ranks[leaderboard.id] = null
      continue
    }

    ranks[leaderboard.id] = {
      rank: entry.rank,
      score: entry.score,
    }
  }

  return ranks
}

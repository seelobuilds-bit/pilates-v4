import {
  LeaderboardCategory,
  LeaderboardParticipantType,
} from "@prisma/client"
import { db } from "@/lib/db"
import { LEADERBOARD_DISPLAY_CATEGORIES, groupLeaderboardsByDisplayCategory } from "@/lib/leaderboards/presentation"

type DemoParticipant = {
  id: string
  name: string
  subdomain?: string
  studioId?: string
}

type DemoEntry = {
  id: string
  studioId: string | null
  teacherId: string | null
  score: number
  rank: number
  previousRank: number | null
  lastUpdated: Date
  participant: DemoParticipant | null
}

type DemoPeriod = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  totalEntries: number
  entries: DemoEntry[]
}

type DemoPrize = {
  id: string
  position: number
  name: string
  description: string | null
  prizeType: string
  prizeValue: number | null
}

type DemoLeaderboard = {
  id: string
  name: string
  description: string
  category: LeaderboardCategory
  participantType: LeaderboardParticipantType
  timeframe: string
  metricName: string
  metricUnit: string | null
  color: string | null
  icon: string | null
  isFeatured: boolean
  prizes: DemoPrize[]
  currentPeriod: DemoPeriod
}

type DemoViewer = {
  role: string
  studioId: string | null
  studioName: string | null
  teacherId: string | null
}

const STUDIO_PEERS = [
  { id: "peer-studio-1", name: "North House Pilates", subdomain: "north-house" },
  { id: "peer-studio-2", name: "Harbour Reform Studio", subdomain: "harbour-reform" },
  { id: "peer-studio-3", name: "Forme Pilates Club", subdomain: "forme-club" },
  { id: "peer-studio-4", name: "Atelier Movement", subdomain: "atelier-movement" },
  { id: "peer-studio-5", name: "Studio Lune", subdomain: "studio-lune" },
]

const TEACHER_PEERS = [
  { id: "peer-teacher-1", name: "Freya Morgan", studioId: "peer-studio-1" },
  { id: "peer-teacher-2", name: "Matilda Hayes", studioId: "peer-studio-2" },
  { id: "peer-teacher-3", name: "Harriet Brooks", studioId: "peer-studio-3" },
  { id: "peer-teacher-4", name: "Poppy Ellis", studioId: "peer-studio-4" },
  { id: "peer-teacher-5", name: "Georgia Flynn", studioId: "peer-studio-5" },
]

function makePrize(position: number, name: string, prizeType: string, prizeValue: number | null): DemoPrize {
  return {
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${position}`,
    position,
    name,
    description: null,
    prizeType,
    prizeValue,
  }
}

function makeEntry(params: {
  id: string
  rank: number
  score: number
  participantType: LeaderboardParticipantType
  participant: DemoParticipant
}) {
  return {
    id: `${params.id}-entry`,
    studioId: params.participantType === "STUDIO" ? params.participant.id : null,
    teacherId: params.participantType === "TEACHER" ? params.participant.id : null,
    score: params.score,
    rank: params.rank,
    previousRank: Math.max(1, params.rank + (params.rank % 2 === 0 ? -1 : 1)),
    lastUpdated: new Date(),
    participant: params.participant,
  }
}

function buildLeaderboard(params: {
  id: string
  name: string
  description: string
  category: LeaderboardCategory
  participantType: LeaderboardParticipantType
  metricName: string
  metricUnit?: string | null
  entries: DemoEntry[]
  prizes?: DemoPrize[]
  color?: string | null
  icon?: string | null
}) {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    id: params.id,
    name: params.name,
    description: params.description,
    category: params.category,
    participantType: params.participantType,
    timeframe: "MONTHLY",
    metricName: params.metricName,
    metricUnit: params.metricUnit ?? null,
    color: params.color ?? null,
    icon: params.icon ?? null,
    isFeatured: true,
    prizes:
      params.prizes ?? [
        makePrize(1, "Bali Reset Weekend", "HOLIDAY", 1800),
        makePrize(2, "Lululemon Kit Drop", "MERCHANDISE", 350),
        makePrize(3, "CURRENT Feature Spotlight", "FEATURE_SPOTLIGHT", null),
      ],
    currentPeriod: {
      id: `${params.id}-period`,
      name: "Current Month",
      startDate,
      endDate,
      totalEntries: params.entries.length,
      entries: params.entries,
    },
  } satisfies DemoLeaderboard
}

export async function buildDemoWebLeaderboardsPayload(viewer: DemoViewer) {
  const teacherRows = viewer.studioId
    ? await db.teacher.findMany({
        where: { studioId: viewer.studioId, isActive: true },
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          user: {
            firstName: "asc",
          },
        },
        take: 5,
      })
    : []

  const studioParticipant: DemoParticipant = {
    id: viewer.studioId || "demo-studio",
    name: viewer.studioName || "CURRENT Demo Studio",
    subdomain: "demo-preview",
  }

  const teacherParticipants: DemoParticipant[] = teacherRows.map((teacher) => ({
    id: teacher.id,
    name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    studioId: viewer.studioId || undefined,
  }))

  const studioEntriesA = [
    makeEntry({ id: "demo-studio", rank: 2, score: 184, participantType: "STUDIO", participant: studioParticipant }),
    makeEntry({ id: "peer-studio-1", rank: 1, score: 196, participantType: "STUDIO", participant: STUDIO_PEERS[0] }),
    makeEntry({ id: "peer-studio-2", rank: 3, score: 172, participantType: "STUDIO", participant: STUDIO_PEERS[1] }),
    makeEntry({ id: "peer-studio-3", rank: 4, score: 166, participantType: "STUDIO", participant: STUDIO_PEERS[2] }),
    makeEntry({ id: "peer-studio-4", rank: 5, score: 151, participantType: "STUDIO", participant: STUDIO_PEERS[3] }),
  ]

  const studioEntriesB = [
    makeEntry({ id: "peer-studio-5", rank: 1, score: 92.4, participantType: "STUDIO", participant: STUDIO_PEERS[4] }),
    makeEntry({ id: "demo-studio-retention", rank: 2, score: 89.1, participantType: "STUDIO", participant: studioParticipant }),
    makeEntry({ id: "peer-studio-1-retention", rank: 3, score: 87.8, participantType: "STUDIO", participant: STUDIO_PEERS[0] }),
    makeEntry({ id: "peer-studio-2-retention", rank: 4, score: 84.6, participantType: "STUDIO", participant: STUDIO_PEERS[1] }),
    makeEntry({ id: "peer-studio-3-retention", rank: 5, score: 82.2, participantType: "STUDIO", participant: STUDIO_PEERS[2] }),
  ]

  const primaryTeacher = teacherParticipants[0] || {
    id: "demo-teacher-fallback",
    name: "Lead Demo Instructor",
    studioId: viewer.studioId || undefined,
  }
  const secondaryTeacher = teacherParticipants[1] || primaryTeacher

  const teacherEntriesA = [
    makeEntry({ id: primaryTeacher.id, rank: 3, score: 71, participantType: "TEACHER", participant: primaryTeacher }),
    makeEntry({ id: TEACHER_PEERS[0].id, rank: 1, score: 85, participantType: "TEACHER", participant: TEACHER_PEERS[0] }),
    makeEntry({ id: TEACHER_PEERS[1].id, rank: 2, score: 79, participantType: "TEACHER", participant: TEACHER_PEERS[1] }),
    makeEntry({ id: TEACHER_PEERS[2].id, rank: 4, score: 67, participantType: "TEACHER", participant: TEACHER_PEERS[2] }),
    makeEntry({ id: secondaryTeacher.id, rank: 5, score: 61, participantType: "TEACHER", participant: secondaryTeacher }),
  ]

  const teacherEntriesB = [
    makeEntry({ id: TEACHER_PEERS[3].id, rank: 1, score: 94.2, participantType: "TEACHER", participant: TEACHER_PEERS[3] }),
    makeEntry({ id: primaryTeacher.id, rank: 2, score: 91.7, participantType: "TEACHER", participant: primaryTeacher }),
    makeEntry({ id: TEACHER_PEERS[4].id, rank: 3, score: 88.6, participantType: "TEACHER", participant: TEACHER_PEERS[4] }),
    makeEntry({ id: secondaryTeacher.id, rank: 4, score: 84.9, participantType: "TEACHER", participant: secondaryTeacher }),
    makeEntry({ id: TEACHER_PEERS[1].id, rank: 5, score: 83.1, participantType: "TEACHER", participant: TEACHER_PEERS[1] }),
  ]

  const studioLeaderboards = [
    buildLeaderboard({
      id: "demo-studio-most-bookings",
      name: "Most Bookings Closed",
      description: "Demo-only comparison showing how the studio is pacing against similar CURRENT operators.",
      category: LeaderboardCategory.MOST_BOOKINGS,
      participantType: "STUDIO",
      metricName: "Bookings",
      entries: studioEntriesA,
      color: "#2563eb",
      icon: "Calendar",
    }),
    buildLeaderboard({
      id: "demo-studio-retention",
      name: "Highest Retention",
      description: "Demo-only retention race against peer studios.",
      category: LeaderboardCategory.HIGHEST_RETENTION,
      participantType: "STUDIO",
      metricName: "Retention",
      metricUnit: "%",
      entries: studioEntriesB,
      color: "#059669",
      icon: "TrendingUp",
    }),
  ]

  const teacherLeaderboards = [
    buildLeaderboard({
      id: "demo-teacher-classes",
      name: "Most Classes Taught",
      description: "Demo-only teacher competition for class volume.",
      category: LeaderboardCategory.MOST_CLASSES_TAUGHT,
      participantType: "TEACHER",
      metricName: "Classes",
      entries: teacherEntriesA,
      color: "#7c3aed",
      icon: "BookOpen",
    }),
    buildLeaderboard({
      id: "demo-teacher-attendance",
      name: "Highest Attendance Rate",
      description: "Demo-only leaderboard for teacher fill and attendance performance.",
      category: LeaderboardCategory.HIGHEST_ATTENDANCE_RATE,
      participantType: "TEACHER",
      metricName: "Attendance",
      metricUnit: "%",
      entries: teacherEntriesB,
      color: "#db2777",
      icon: "Heart",
    }),
  ]

  const leaderboards = [...studioLeaderboards, ...teacherLeaderboards]

  const myRanks: Record<string, { rank: number; score: number } | null> = {}
  for (const leaderboard of leaderboards) {
    const matchingEntry = leaderboard.currentPeriod.entries.find((entry) => {
      if (leaderboard.participantType === "STUDIO") {
        return entry.studioId === viewer.studioId
      }
      if (viewer.role === "TEACHER" && viewer.teacherId) {
        return entry.teacherId === viewer.teacherId
      }
      return false
    })

    myRanks[leaderboard.id] = matchingEntry
      ? { rank: matchingEntry.rank, score: matchingEntry.score }
      : null
  }

  return {
    leaderboards,
    grouped: groupLeaderboardsByDisplayCategory(leaderboards),
    myRanks,
    categories: LEADERBOARD_DISPLAY_CATEGORIES,
  }
}

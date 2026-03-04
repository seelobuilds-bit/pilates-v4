import { type LeaderboardParticipantType } from "@prisma/client"
import { type EnrichedLeaderboard, type EnrichedLeaderboardEntry, type EnrichedLeaderboardPeriod } from "./query"
import {
  groupLeaderboardsByDisplayCategory,
  LEADERBOARD_DISPLAY_CATEGORIES,
} from "./presentation"

type UserRanks = Record<string, { rank: number; score: number } | null>

type MobileStudioSummary = {
  id: string
  name: string
  subdomain: string
  primaryColor: string | null
  currency: string | null
}

type LeaderboardDateFormatter<TDate> = (value: Date) => TDate

type AdaptedLeaderboardEntry<TDate> = Omit<EnrichedLeaderboardEntry, "lastUpdated"> & {
  lastUpdated: TDate
}

type AdaptedLeaderboardPeriod<TDate> = Omit<EnrichedLeaderboardPeriod, "startDate" | "endDate" | "entries"> & {
  startDate: TDate
  endDate: TDate
  entries: AdaptedLeaderboardEntry<TDate>[]
}

type AdaptedLeaderboard<TDate> = Omit<EnrichedLeaderboard, "currentPeriod"> & {
  currentPeriod: AdaptedLeaderboardPeriod<TDate> | null
}

function adaptLeaderboardEntry<TDate>(
  entry: EnrichedLeaderboardEntry,
  formatDate: LeaderboardDateFormatter<TDate>
): AdaptedLeaderboardEntry<TDate> {
  return {
    ...entry,
    lastUpdated: formatDate(entry.lastUpdated),
  }
}

function adaptLeaderboardPeriod<TDate>(
  period: EnrichedLeaderboardPeriod,
  formatDate: LeaderboardDateFormatter<TDate>
): AdaptedLeaderboardPeriod<TDate> {
  return {
    ...period,
    startDate: formatDate(period.startDate),
    endDate: formatDate(period.endDate),
    entries: period.entries.map((entry) => adaptLeaderboardEntry(entry, formatDate)),
  }
}

export function adaptLeaderboardRows<TDate>(
  leaderboards: EnrichedLeaderboard[],
  formatDate: LeaderboardDateFormatter<TDate>
): AdaptedLeaderboard<TDate>[] {
  return leaderboards.map((leaderboard) => ({
    ...leaderboard,
    currentPeriod: leaderboard.currentPeriod
      ? adaptLeaderboardPeriod(leaderboard.currentPeriod, formatDate)
      : null,
  }))
}

export function buildWebLeaderboardsResponsePayload(args: {
  leaderboards: EnrichedLeaderboard[]
  userRanks: UserRanks
}) {
  const leaderboardRows = adaptLeaderboardRows(args.leaderboards, (value) => value)
  return {
    leaderboards: leaderboardRows,
    grouped: groupLeaderboardsByDisplayCategory(leaderboardRows),
    myRanks: args.userRanks,
    categories: LEADERBOARD_DISPLAY_CATEGORIES,
  }
}

export function buildMobileLeaderboardsResponsePayload(args: {
  role: "OWNER" | "TEACHER"
  studio: MobileStudioSummary
  participantType: LeaderboardParticipantType
  leaderboards: EnrichedLeaderboard[]
  myRanks: UserRanks
}) {
  const leaderboardRows = adaptLeaderboardRows(args.leaderboards, (value) => value.toISOString())
  return {
    role: args.role,
    studio: args.studio,
    participantType: args.participantType,
    categories: LEADERBOARD_DISPLAY_CATEGORIES,
    grouped: groupLeaderboardsByDisplayCategory(leaderboardRows).map((category) => ({
      ...category,
      leaderboards: category.leaderboards.map((leaderboard) => leaderboard.id),
    })),
    leaderboards: leaderboardRows,
    myRanks: args.myRanks,
  }
}

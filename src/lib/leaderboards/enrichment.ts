import { attachParticipantsToEntries } from "./presentation"

type LeaderboardEntryParticipantRef = {
  studioId: string | null
  teacherId: string | null
}

type ParticipantMaps = Parameters<typeof attachParticipantsToEntries>[1]

type LeaderboardPeriodRow<TEntry extends LeaderboardEntryParticipantRef> = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  entries: TEntry[]
}

export function enrichLeaderboardRowsWithParticipants<
  TEntry extends LeaderboardEntryParticipantRef,
  TPeriod extends LeaderboardPeriodRow<TEntry>,
  TLeaderboard extends { periods: TPeriod[] },
>(params: {
  leaderboards: TLeaderboard[]
  expectedParticipantCount: number
  participantMaps: ParticipantMaps
}) {
  const { leaderboards, expectedParticipantCount, participantMaps } = params
  return leaderboards.map((leaderboard) => {
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
        ...currentPeriod,
        totalEntries: expectedParticipantCount,
        entries: attachParticipantsToEntries(currentPeriod.entries, participantMaps),
      },
    }
  })
}

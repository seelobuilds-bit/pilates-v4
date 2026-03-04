import { strict as assert } from "assert"
import { createStudioParticipantMap, createTeacherParticipantMap } from "../../src/lib/leaderboards/presentation"
import { enrichLeaderboardRowsWithParticipants } from "../../src/lib/leaderboards/enrichment"

const participantMaps = {
  studioById: createStudioParticipantMap([{ id: "studio_1", name: "Studio One", subdomain: "studio-one" }]),
  teacherById: createTeacherParticipantMap([{ id: "teacher_1", name: "Teacher One", studioId: "studio_1" }]),
}

const enriched = enrichLeaderboardRowsWithParticipants({
  leaderboards: [
    {
      id: "lb_1",
      name: "Top Revenue",
      periods: [
        {
          id: "period_1",
          name: "March",
          startDate: new Date("2026-03-01T00:00:00.000Z"),
          endDate: new Date("2026-04-01T00:00:00.000Z"),
          entries: [
            {
              id: "entry_1",
              studioId: "studio_1",
              teacherId: null,
              score: 100,
              rank: 1,
              previousRank: null,
              lastUpdated: new Date("2026-03-15T00:00:00.000Z"),
            },
            {
              id: "entry_2",
              studioId: "missing",
              teacherId: null,
              score: 90,
              rank: 2,
              previousRank: null,
              lastUpdated: new Date("2026-03-15T00:00:00.000Z"),
            },
          ],
        },
      ],
    },
    {
      id: "lb_2",
      name: "Top Engagement",
      periods: [],
    },
  ],
  expectedParticipantCount: 55,
  participantMaps,
})

assert.equal(enriched.length, 2)
assert.equal(enriched[0].currentPeriod?.totalEntries, 55)
assert.equal(enriched[0].currentPeriod?.entries.length, 1)
assert.equal(enriched[0].currentPeriod?.entries[0].participant?.name, "Studio One")
assert.equal(enriched[1].currentPeriod, null)

console.log("Leaderboard query logic passed")

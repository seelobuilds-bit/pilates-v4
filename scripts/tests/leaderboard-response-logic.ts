import { strict as assert } from "assert"
import {
  buildMobileLeaderboardsResponsePayload,
  buildWebLeaderboardsResponsePayload,
} from "../../src/lib/leaderboards/response"

const leaderboards = [
  {
    id: "lb_1",
    name: "Top Revenue",
    description: "Revenue leaderboard",
    category: "TOP_REVENUE",
    participantType: "STUDIO",
    timeframe: "MONTHLY",
    metricName: "Revenue",
    metricUnit: "USD",
    color: "#111111",
    icon: "Trophy",
    isFeatured: true,
    prizes: [],
    currentPeriod: {
      id: "period_1",
      name: "March 2026",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-04-01T00:00:00.000Z"),
      totalEntries: 10,
      entries: [
        {
          id: "entry_1",
          studioId: "studio_1",
          teacherId: null,
          score: 100,
          rank: 1,
          previousRank: 2,
          lastUpdated: new Date("2026-03-10T00:00:00.000Z"),
          participant: { id: "studio_1", name: "Studio One", subdomain: "studio-one" },
        },
      ],
    },
  },
] as const

const ranks = { lb_1: { rank: 1, score: 100 } }

const webPayload = buildWebLeaderboardsResponsePayload({
  leaderboards: leaderboards as never,
  userRanks: ranks,
})
assert.equal(webPayload.leaderboards[0].currentPeriod?.startDate instanceof Date, true)
assert.equal(webPayload.grouped.length, 1)
assert.equal(webPayload.myRanks.lb_1?.rank, 1)

const mobilePayload = buildMobileLeaderboardsResponsePayload({
  role: "OWNER",
  studio: {
    id: "studio_1",
    name: "Studio One",
    subdomain: "studio-one",
    primaryColor: "#111111",
    currency: "USD",
  },
  participantType: "STUDIO",
  leaderboards: leaderboards as never,
  myRanks: ranks,
})
assert.equal(typeof mobilePayload.leaderboards[0].currentPeriod?.startDate, "string")
assert.equal(typeof mobilePayload.leaderboards[0].currentPeriod?.entries[0].lastUpdated, "string")
assert.deepEqual(mobilePayload.grouped[0].leaderboards, ["lb_1"])

console.log("Leaderboard response logic passed")

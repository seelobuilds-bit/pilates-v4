import { strict as assert } from "assert"
import {
  calculateLeaderboardDerivedMetrics,
  leaderboardRatioPercentage,
  normalizeLeaderboardScore,
  roundLeaderboardValue,
} from "../../src/lib/leaderboards/metrics"

assert.equal(roundLeaderboardValue(12.34567, 2), 12.35)
assert.equal(leaderboardRatioPercentage(3, 8, 2), 37.5)
assert.equal(leaderboardRatioPercentage(0, 0, 2), 0)
assert.equal(normalizeLeaderboardScore(12.345678), 12.3457)
assert.equal(normalizeLeaderboardScore(-5), 0)

const metrics = calculateLeaderboardDerivedMetrics({
  bookingsCurrentCount: 20,
  bookingsPreviousCount: 10,
  revenue: 5000,
  newClients: 4,
  previousNewClients: 2,
  activeBookedClients: 18,
  activeClients: 24,
  attendance: 50,
  capacity: 80,
  socialTriggered: 30,
  socialResponded: 9,
  socialBooked: 3,
  reviewCount: 4,
  reviewRatingSum: 17,
  createdAt: new Date("2026-02-15T00:00:00.000Z"),
  newcomerThreshold: new Date("2025-11-01T00:00:00.000Z"),
  courseEnrollments: 6,
})

assert.deepEqual(metrics, {
  attendanceRate: 62.5,
  retention: 75,
  socialEngagementRate: 40,
  averageRating: 4.25,
  newcomerScore: 28,
  comebackScore: 10,
  growthPercent: 100,
  clientGrowthPercent: 100,
  allRounder: 152,
})

const nonNewcomer = calculateLeaderboardDerivedMetrics({
  bookingsCurrentCount: 5,
  bookingsPreviousCount: 8,
  revenue: 0,
  newClients: 0,
  previousNewClients: 1,
  activeBookedClients: 0,
  activeClients: 0,
  attendance: 0,
  capacity: 0,
  socialTriggered: 0,
  socialResponded: 0,
  socialBooked: 0,
  reviewCount: 0,
  reviewRatingSum: 0,
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  newcomerThreshold: new Date("2025-11-01T00:00:00.000Z"),
  courseEnrollments: 0,
})

assert.equal(nonNewcomer.newcomerScore, 0)
assert.equal(nonNewcomer.comebackScore, 0)

console.log("Leaderboard score logic passed")

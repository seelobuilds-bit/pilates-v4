export function roundLeaderboardValue(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function leaderboardRatioPercentage(numerator: number, denominator: number, precision = 2) {
  if (denominator <= 0) return 0
  return roundLeaderboardValue((numerator / denominator) * 100, precision)
}

export function normalizeLeaderboardScore(rawScore: number) {
  if (!Number.isFinite(rawScore)) return 0
  if (rawScore < 0) return 0
  return roundLeaderboardValue(rawScore, 4)
}

export function calculateLeaderboardDerivedMetrics(input: {
  bookingsCurrentCount: number
  bookingsPreviousCount: number
  revenue: number
  newClients: number
  previousNewClients: number
  activeBookedClients: number
  activeClients: number
  attendance: number
  capacity: number
  socialTriggered: number
  socialResponded: number
  socialBooked: number
  reviewCount: number
  reviewRatingSum: number
  createdAt: Date
  newcomerThreshold: Date
  courseEnrollments: number
}) {
  const attendanceRate = leaderboardRatioPercentage(input.attendance, input.capacity, 4)
  const retention = leaderboardRatioPercentage(input.activeBookedClients, input.activeClients, 4)
  const socialEngagementRate = leaderboardRatioPercentage(
    input.socialResponded + input.socialBooked,
    input.socialTriggered,
    4
  )
  const averageRating = input.reviewCount > 0 ? input.reviewRatingSum / input.reviewCount : 0
  const newcomerScore =
    input.createdAt >= input.newcomerThreshold ? input.bookingsCurrentCount + input.newClients * 2 : 0
  const comebackScore = Math.max(0, input.bookingsCurrentCount - input.bookingsPreviousCount)
  const growthPercent = leaderboardRatioPercentage(
    input.bookingsCurrentCount - input.bookingsPreviousCount,
    Math.max(1, input.bookingsPreviousCount),
    4
  )
  const clientGrowthPercent = leaderboardRatioPercentage(
    input.newClients - input.previousNewClients,
    Math.max(1, input.previousNewClients),
    4
  )
  const allRounder =
    input.bookingsCurrentCount + input.revenue / 100 + input.newClients * 10 + input.socialBooked * 8 + input.courseEnrollments * 3

  return {
    attendanceRate,
    retention,
    socialEngagementRate,
    averageRating,
    newcomerScore,
    comebackScore,
    growthPercent,
    clientGrowthPercent,
    allRounder,
  }
}

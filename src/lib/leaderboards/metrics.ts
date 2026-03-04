import { LeaderboardCategory, LeaderboardParticipantType } from "@prisma/client"

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

type LeaderboardScoreByCategoryInput = {
  category: LeaderboardCategory
  metricName: string
  participantType: LeaderboardParticipantType
  bookingsCurrentCount: number
  revenue: number
  classesCount: number
  newClients: number
  socialTriggered: number
  socialResponded: number
  socialBooked: number
  socialPosts: number
  contentConsistencyDays: number
  coursesCreated: number
  courseEnrollments: number
  coursesCompleted: number
  mostActiveCommunity: number
  topReviewer: number
  referrals: number
  derived: ReturnType<typeof calculateLeaderboardDerivedMetrics>
}

export function resolveLeaderboardScoreByCategory(input: LeaderboardScoreByCategoryInput) {
  const isStudio = input.participantType === LeaderboardParticipantType.STUDIO

  const metricByCategory: Record<LeaderboardCategory, number> = {
    MOST_CONTENT_POSTED: input.socialPosts,
    MOST_SOCIAL_VIEWS: input.socialTriggered * 3 + input.socialResponded,
    MOST_SOCIAL_LIKES: input.socialResponded,
    MOST_SOCIAL_ENGAGEMENT: input.derived.socialEngagementRate,
    CONTENT_CONSISTENCY: input.contentConsistencyDays,
    FASTEST_GROWING: isStudio ? input.derived.clientGrowthPercent : input.derived.growthPercent,
    BIGGEST_GROWTH_MONTHLY: input.derived.growthPercent,
    BIGGEST_GROWTH_QUARTERLY: input.derived.growthPercent,
    MOST_NEW_CLIENTS: input.newClients,
    HIGHEST_RETENTION: isStudio ? input.derived.retention : 0,
    MOST_COURSES_COMPLETED: input.coursesCompleted,
    MOST_COURSE_ENROLLMENTS: input.courseEnrollments,
    TOP_COURSE_CREATOR: input.coursesCreated,
    BEST_COURSE_RATINGS: input.derived.averageRating,
    MOST_BOOKINGS: input.bookingsCurrentCount,
    HIGHEST_ATTENDANCE_RATE: input.derived.attendanceRate,
    MOST_CLASSES_TAUGHT: input.classesCount,
    TOP_REVENUE: input.revenue,
    MOST_ACTIVE_COMMUNITY: input.mostActiveCommunity,
    TOP_REVIEWER: input.topReviewer,
    MOST_REFERRALS: input.referrals,
    NEWCOMER_OF_MONTH: input.derived.newcomerScore,
    COMEBACK_CHAMPION: input.derived.comebackScore,
    ALL_ROUNDER: input.derived.allRounder,
  }

  const fallbackMetricName = input.metricName.toLowerCase()
  const fallbackScore = fallbackMetricName.includes("book")
    ? input.bookingsCurrentCount
    : fallbackMetricName.includes("revenue")
      ? input.revenue
      : fallbackMetricName.includes("class")
        ? input.classesCount
        : fallbackMetricName.includes("client")
          ? input.newClients
          : fallbackMetricName.includes("engage")
            ? input.derived.socialEngagementRate
            : fallbackMetricName.includes("social")
              ? input.socialTriggered
              : 0

  return metricByCategory[input.category] ?? fallbackScore
}

export function buildLeaderboardMetricsBreakdown(input: {
  participantType: LeaderboardParticipantType
  bookingsCurrentCount: number
  bookingsPreviousCount: number
  revenue: number
  classesCount: number
  newClients: number
  socialTriggered: number
  socialResponded: number
  socialBooked: number
  contentConsistencyDays: number
  coursesCreated: number
  courseEnrollments: number
  coursesCompleted: number
  mostActiveCommunity: number
  topReviewer: number
  referrals: number
  derived: ReturnType<typeof calculateLeaderboardDerivedMetrics>
}) {
  const isStudio = input.participantType === LeaderboardParticipantType.STUDIO

  return {
    bookingsCurrent: input.bookingsCurrentCount,
    bookingsPrevious: input.bookingsPreviousCount,
    revenue: roundLeaderboardValue(input.revenue, 2),
    classes: input.classesCount,
    attendanceRate: roundLeaderboardValue(input.derived.attendanceRate, 2),
    newClients: input.newClients,
    retention: roundLeaderboardValue(isStudio ? input.derived.retention : 0, 2),
    socialTriggered: input.socialTriggered,
    socialResponded: input.socialResponded,
    socialBooked: input.socialBooked,
    socialEngagementRate: roundLeaderboardValue(input.derived.socialEngagementRate, 2),
    contentConsistencyDays: input.contentConsistencyDays,
    coursesCreated: input.coursesCreated,
    courseEnrollments: input.courseEnrollments,
    coursesCompleted: input.coursesCompleted,
    averageRating: roundLeaderboardValue(input.derived.averageRating, 2),
    communityMessages: input.mostActiveCommunity,
    topReviewer: input.topReviewer,
    referrals: input.referrals,
    newcomerScore: input.derived.newcomerScore,
    comebackScore: input.derived.comebackScore,
  }
}

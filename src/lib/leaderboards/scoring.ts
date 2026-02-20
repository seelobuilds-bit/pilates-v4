import { randomUUID } from "node:crypto"
import {
  Leaderboard,
  LeaderboardCategory,
  LeaderboardParticipantType,
  LeaderboardPeriod,
  Prisma,
} from "@prisma/client"
import { db } from "@/lib/db"

const ATTENDED_BOOKING_STATUSES = new Set(["CONFIRMED", "COMPLETED", "NO_SHOW"])
const NEWCOMER_WINDOW_DAYS = 120
const MS_IN_DAY = 1000 * 60 * 60 * 24

type Participant = {
  id: string
  createdAt: Date
}

type ScoreEntry = {
  studioId: string | null
  teacherId: string | null
  score: number
  previousScore: number | null
  rank: number
  previousRank: number | null
  metricsBreakdown: Prisma.JsonObject
}

function roundTo(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function ratioPercentage(numerator: number, denominator: number, precision = 2) {
  if (denominator <= 0) return 0
  return roundTo((numerator / denominator) * 100, precision)
}

function incrementMap(map: Map<string, number>, key: string | null | undefined, amount = 1) {
  if (!key) return
  map.set(key, (map.get(key) || 0) + amount)
}

function addToSetMap(map: Map<string, Set<string>>, key: string | null | undefined, value: string) {
  if (!key) return
  const existing = map.get(key) || new Set<string>()
  existing.add(value)
  map.set(key, existing)
}

function toDayKey(input: Date) {
  return input.toISOString().slice(0, 10)
}

function normalizeScore(rawScore: number) {
  if (!Number.isFinite(rawScore)) return 0
  if (rawScore < 0) return 0
  return roundTo(rawScore, 4)
}

function compareForRanking(
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

export async function populateLeaderboardPeriodEntries(params: {
  leaderboard: Pick<
    Leaderboard,
    "id" | "category" | "participantType" | "higherIsBetter" | "minimumEntries" | "metricName"
  >
  period: Pick<LeaderboardPeriod, "id" | "startDate" | "endDate">
}) {
  const { leaderboard, period } = params

  const rangeStart = period.startDate
  const rangeEnd = period.endDate
  const rangeDuration = Math.max(1, rangeEnd.getTime() - rangeStart.getTime() + 1)
  const previousRangeStart = new Date(rangeStart.getTime() - rangeDuration)
  const previousRangeEnd = new Date(rangeStart.getTime() - 1)
  const newcomerThreshold = new Date(rangeEnd.getTime() - NEWCOMER_WINDOW_DAYS * MS_IN_DAY)

  const participants: Participant[] =
    leaderboard.participantType === LeaderboardParticipantType.STUDIO
      ? await db.studio.findMany({
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : await db.teacher.findMany({
          where: { isActive: true },
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })

  if (participants.length === 0) {
    await db.leaderboardEntry.deleteMany({ where: { periodId: period.id } })
    await db.leaderboard.update({
      where: { id: leaderboard.id },
      data: { lastCalculated: new Date() },
    })
    return { entriesCreated: 0 }
  }

  const [
    bookingsCurrent,
    bookingsPrevious,
    sessionsCurrent,
    clientsCurrent,
    clientsPrevious,
    activeClientsCurrent,
    socialAccounts,
    socialEventsCurrent,
    coursesCurrent,
    enrollmentsCurrent,
    completionsCurrent,
    reviewsCurrent,
    communityMessagesCurrent,
    affiliateSalesCurrent,
  ] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { not: "CANCELLED" },
        classSession: {
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
      },
      select: {
        studioId: true,
        paidAmount: true,
        classSession: {
          select: {
            teacherId: true,
            classType: { select: { price: true } },
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        status: { not: "CANCELLED" },
        classSession: {
          startTime: { gte: previousRangeStart, lte: previousRangeEnd },
        },
      },
      select: {
        studioId: true,
        classSession: {
          select: { teacherId: true },
        },
      },
    }),
    db.classSession.findMany({
      where: {
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        studioId: true,
        teacherId: true,
        capacity: true,
        bookings: {
          select: { status: true },
        },
      },
    }),
    db.client.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        studioId: true,
      },
    }),
    db.client.findMany({
      where: {
        createdAt: { gte: previousRangeStart, lte: previousRangeEnd },
      },
      select: {
        studioId: true,
      },
    }),
    db.client.findMany({
      where: {
        isActive: true,
      },
      select: {
        studioId: true,
        bookings: {
          where: {
            status: { not: "CANCELLED" },
            classSession: {
              startTime: { gte: rangeStart, lte: rangeEnd },
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.socialMediaAccount.findMany({
      where: { isActive: true },
      select: {
        studioId: true,
        teacherId: true,
        postsCount: true,
      },
    }),
    db.socialMediaFlowEvent.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        createdAt: true,
        responseSent: true,
        converted: true,
        flow: {
          select: {
            account: {
              select: {
                studioId: true,
                teacherId: true,
                teacher: {
                  select: { studioId: true },
                },
              },
            },
          },
        },
      },
    }),
    db.vaultCourse.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        studioId: true,
        creatorId: true,
      },
    }),
    db.vaultEnrollment.findMany({
      where: {
        enrolledAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        teacherId: true,
        course: {
          select: {
            studioId: true,
            creatorId: true,
          },
        },
      },
    }),
    db.vaultEnrollment.findMany({
      where: {
        completedAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        teacherId: true,
        course: {
          select: {
            studioId: true,
            creatorId: true,
          },
        },
      },
    }),
    db.vaultReview.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        rating: true,
        teacherId: true,
        course: {
          select: {
            studioId: true,
            creatorId: true,
          },
        },
      },
    }),
    db.vaultSubscriptionChatMessage.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        member: {
          select: {
            subscriber: {
              select: {
                teacherId: true,
                plan: {
                  select: { studioId: true },
                },
              },
            },
          },
        },
      },
    }),
    db.vaultAffiliateSale.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        affiliateLink: {
          select: {
            teacherId: true,
            course: {
              select: { studioId: true },
            },
          },
        },
      },
    }),
  ])

  const bookingsCurrentByStudio = new Map<string, number>()
  const bookingsCurrentByTeacher = new Map<string, number>()
  const bookingsPreviousByStudio = new Map<string, number>()
  const bookingsPreviousByTeacher = new Map<string, number>()
  const revenueByStudio = new Map<string, number>()
  const revenueByTeacher = new Map<string, number>()
  const classesByStudio = new Map<string, number>()
  const classesByTeacher = new Map<string, number>()
  const attendanceByStudio = new Map<string, number>()
  const attendanceByTeacher = new Map<string, number>()
  const capacityByStudio = new Map<string, number>()
  const capacityByTeacher = new Map<string, number>()
  const newClientsByStudio = new Map<string, number>()
  const previousNewClientsByStudio = new Map<string, number>()
  const activeClientsByStudio = new Map<string, number>()
  const activeBookedClientsByStudio = new Map<string, number>()
  const socialPostsByStudio = new Map<string, number>()
  const socialPostsByTeacher = new Map<string, number>()
  const socialTriggeredByStudio = new Map<string, number>()
  const socialTriggeredByTeacher = new Map<string, number>()
  const socialRespondedByStudio = new Map<string, number>()
  const socialRespondedByTeacher = new Map<string, number>()
  const socialBookedByStudio = new Map<string, number>()
  const socialBookedByTeacher = new Map<string, number>()
  const socialActiveDaysByStudio = new Map<string, Set<string>>()
  const socialActiveDaysByTeacher = new Map<string, Set<string>>()
  const coursesCreatedByStudio = new Map<string, number>()
  const coursesCreatedByTeacher = new Map<string, number>()
  const courseEnrollmentsByStudio = new Map<string, number>()
  const courseEnrollmentsByTeacher = new Map<string, number>()
  const coursesCompletedByStudio = new Map<string, number>()
  const coursesCompletedByTeacher = new Map<string, number>()
  const reviewCountByStudio = new Map<string, number>()
  const reviewRatingSumByStudio = new Map<string, number>()
  const reviewCountByTeacher = new Map<string, number>()
  const reviewRatingSumByTeacher = new Map<string, number>()
  const topReviewerByTeacher = new Map<string, number>()
  const communityMessagesByStudio = new Map<string, number>()
  const communityMessagesByTeacher = new Map<string, number>()
  const referralsByStudio = new Map<string, number>()
  const referralsByTeacher = new Map<string, number>()

  for (const booking of bookingsCurrent) {
    incrementMap(bookingsCurrentByStudio, booking.studioId, 1)
    incrementMap(bookingsCurrentByTeacher, booking.classSession.teacherId, 1)

    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    incrementMap(revenueByStudio, booking.studioId, amount)
    incrementMap(revenueByTeacher, booking.classSession.teacherId, amount)
  }

  for (const booking of bookingsPrevious) {
    incrementMap(bookingsPreviousByStudio, booking.studioId, 1)
    incrementMap(bookingsPreviousByTeacher, booking.classSession.teacherId, 1)
  }

  for (const session of sessionsCurrent) {
    incrementMap(classesByStudio, session.studioId, 1)
    incrementMap(classesByTeacher, session.teacherId, 1)
    incrementMap(capacityByStudio, session.studioId, session.capacity)
    incrementMap(capacityByTeacher, session.teacherId, session.capacity)

    const attendedCount = session.bookings.filter((booking) =>
      ATTENDED_BOOKING_STATUSES.has(booking.status)
    ).length
    incrementMap(attendanceByStudio, session.studioId, attendedCount)
    incrementMap(attendanceByTeacher, session.teacherId, attendedCount)
  }

  for (const client of clientsCurrent) {
    incrementMap(newClientsByStudio, client.studioId, 1)
  }
  for (const client of clientsPrevious) {
    incrementMap(previousNewClientsByStudio, client.studioId, 1)
  }
  for (const client of activeClientsCurrent) {
    incrementMap(activeClientsByStudio, client.studioId, 1)
    if (client.bookings.length > 0) {
      incrementMap(activeBookedClientsByStudio, client.studioId, 1)
    }
  }

  for (const account of socialAccounts) {
    incrementMap(socialPostsByStudio, account.studioId, account.postsCount)
    incrementMap(socialPostsByTeacher, account.teacherId, account.postsCount)
  }

  for (const event of socialEventsCurrent) {
    const account = event.flow.account
    const studioId = account.studioId || account.teacher?.studioId || null
    const teacherId = account.teacherId || null
    const dayKey = toDayKey(event.createdAt)
    incrementMap(socialTriggeredByStudio, studioId, 1)
    incrementMap(socialTriggeredByTeacher, teacherId, 1)
    addToSetMap(socialActiveDaysByStudio, studioId, dayKey)
    addToSetMap(socialActiveDaysByTeacher, teacherId, dayKey)
    if (event.responseSent) {
      incrementMap(socialRespondedByStudio, studioId, 1)
      incrementMap(socialRespondedByTeacher, teacherId, 1)
    }
    if (event.converted) {
      incrementMap(socialBookedByStudio, studioId, 1)
      incrementMap(socialBookedByTeacher, teacherId, 1)
    }
  }

  for (const course of coursesCurrent) {
    incrementMap(coursesCreatedByStudio, course.studioId, 1)
    incrementMap(coursesCreatedByTeacher, course.creatorId, 1)
  }

  for (const enrollment of enrollmentsCurrent) {
    incrementMap(courseEnrollmentsByStudio, enrollment.course.studioId, 1)
    incrementMap(courseEnrollmentsByTeacher, enrollment.course.creatorId, 1)
  }

  for (const completion of completionsCurrent) {
    incrementMap(coursesCompletedByStudio, completion.course.studioId, 1)
    incrementMap(coursesCompletedByTeacher, completion.teacherId, 1)
  }

  for (const review of reviewsCurrent) {
    incrementMap(reviewCountByStudio, review.course.studioId, 1)
    incrementMap(reviewRatingSumByStudio, review.course.studioId, review.rating)
    incrementMap(reviewCountByTeacher, review.course.creatorId, 1)
    incrementMap(reviewRatingSumByTeacher, review.course.creatorId, review.rating)
    incrementMap(topReviewerByTeacher, review.teacherId, 1)
  }

  for (const message of communityMessagesCurrent) {
    const studioId = message.member.subscriber.plan.studioId
    const teacherId = message.member.subscriber.teacherId
    incrementMap(communityMessagesByStudio, studioId, 1)
    incrementMap(communityMessagesByTeacher, teacherId, 1)
  }

  for (const sale of affiliateSalesCurrent) {
    incrementMap(referralsByStudio, sale.affiliateLink.course.studioId, 1)
    incrementMap(referralsByTeacher, sale.affiliateLink.teacherId, 1)
  }

  const byStudio = (map: Map<string, number>, id: string) => map.get(id) || 0
  const byTeacher = (map: Map<string, number>, id: string) => map.get(id) || 0
  const byStudioSetSize = (map: Map<string, Set<string>>, id: string) => map.get(id)?.size || 0
  const byTeacherSetSize = (map: Map<string, Set<string>>, id: string) => map.get(id)?.size || 0

  function getMetricValue(participantId: string, createdAt: Date) {
    const isStudio = leaderboard.participantType === LeaderboardParticipantType.STUDIO
    const bookingsCurrentCount = isStudio
      ? byStudio(bookingsCurrentByStudio, participantId)
      : byTeacher(bookingsCurrentByTeacher, participantId)
    const bookingsPreviousCount = isStudio
      ? byStudio(bookingsPreviousByStudio, participantId)
      : byTeacher(bookingsPreviousByTeacher, participantId)
    const revenue = isStudio
      ? byStudio(revenueByStudio, participantId)
      : byTeacher(revenueByTeacher, participantId)
    const classesCount = isStudio
      ? byStudio(classesByStudio, participantId)
      : byTeacher(classesByTeacher, participantId)
    const attendance = isStudio
      ? byStudio(attendanceByStudio, participantId)
      : byTeacher(attendanceByTeacher, participantId)
    const capacity = isStudio
      ? byStudio(capacityByStudio, participantId)
      : byTeacher(capacityByTeacher, participantId)
    const attendanceRate = ratioPercentage(attendance, capacity, 4)
    const newClients = isStudio ? byStudio(newClientsByStudio, participantId) : 0
    const previousNewClients = isStudio ? byStudio(previousNewClientsByStudio, participantId) : 0
    const retention = isStudio
      ? ratioPercentage(
          byStudio(activeBookedClientsByStudio, participantId),
          byStudio(activeClientsByStudio, participantId),
          4
        )
      : 0
    const socialTriggered = isStudio
      ? byStudio(socialTriggeredByStudio, participantId)
      : byTeacher(socialTriggeredByTeacher, participantId)
    const socialResponded = isStudio
      ? byStudio(socialRespondedByStudio, participantId)
      : byTeacher(socialRespondedByTeacher, participantId)
    const socialBooked = isStudio
      ? byStudio(socialBookedByStudio, participantId)
      : byTeacher(socialBookedByTeacher, participantId)
    const socialPosts = isStudio
      ? byStudio(socialPostsByStudio, participantId)
      : byTeacher(socialPostsByTeacher, participantId)
    const contentConsistencyDays = isStudio
      ? byStudioSetSize(socialActiveDaysByStudio, participantId)
      : byTeacherSetSize(socialActiveDaysByTeacher, participantId)
    const socialEngagementRate = ratioPercentage(socialResponded + socialBooked, socialTriggered, 4)
    const coursesCreated = isStudio
      ? byStudio(coursesCreatedByStudio, participantId)
      : byTeacher(coursesCreatedByTeacher, participantId)
    const courseEnrollments = isStudio
      ? byStudio(courseEnrollmentsByStudio, participantId)
      : byTeacher(courseEnrollmentsByTeacher, participantId)
    const coursesCompleted = isStudio
      ? byStudio(coursesCompletedByStudio, participantId)
      : byTeacher(coursesCompletedByTeacher, participantId)
    const reviewCount = isStudio
      ? byStudio(reviewCountByStudio, participantId)
      : byTeacher(reviewCountByTeacher, participantId)
    const reviewRatingSum = isStudio
      ? byStudio(reviewRatingSumByStudio, participantId)
      : byTeacher(reviewRatingSumByTeacher, participantId)
    const averageRating = reviewCount > 0 ? reviewRatingSum / reviewCount : 0
    const mostActiveCommunity = isStudio
      ? byStudio(communityMessagesByStudio, participantId)
      : byTeacher(communityMessagesByTeacher, participantId)
    const topReviewer = isStudio ? reviewCount : byTeacher(topReviewerByTeacher, participantId)
    const referrals = isStudio
      ? byStudio(referralsByStudio, participantId)
      : byTeacher(referralsByTeacher, participantId)
    const newcomerScore = createdAt >= newcomerThreshold ? bookingsCurrentCount + newClients * 2 : 0
    const comebackScore = Math.max(0, bookingsCurrentCount - bookingsPreviousCount)
    const growthPercent = ratioPercentage(
      bookingsCurrentCount - bookingsPreviousCount,
      Math.max(1, bookingsPreviousCount),
      4
    )
    const clientGrowthPercent = ratioPercentage(
      newClients - previousNewClients,
      Math.max(1, previousNewClients),
      4
    )
    const allRounder = bookingsCurrentCount + revenue / 100 + newClients * 10 + socialBooked * 8 + courseEnrollments * 3

    const metricByCategory: Record<LeaderboardCategory, number> = {
      MOST_CONTENT_POSTED: socialPosts,
      MOST_SOCIAL_VIEWS: socialTriggered * 3 + socialResponded,
      MOST_SOCIAL_LIKES: socialResponded,
      MOST_SOCIAL_ENGAGEMENT: socialEngagementRate,
      CONTENT_CONSISTENCY: contentConsistencyDays,
      FASTEST_GROWING: isStudio ? clientGrowthPercent : growthPercent,
      BIGGEST_GROWTH_MONTHLY: growthPercent,
      BIGGEST_GROWTH_QUARTERLY: growthPercent,
      MOST_NEW_CLIENTS: newClients,
      HIGHEST_RETENTION: retention,
      MOST_COURSES_COMPLETED: coursesCompleted,
      MOST_COURSE_ENROLLMENTS: courseEnrollments,
      TOP_COURSE_CREATOR: coursesCreated,
      BEST_COURSE_RATINGS: averageRating,
      MOST_BOOKINGS: bookingsCurrentCount,
      HIGHEST_ATTENDANCE_RATE: attendanceRate,
      MOST_CLASSES_TAUGHT: classesCount,
      TOP_REVENUE: revenue,
      MOST_ACTIVE_COMMUNITY: mostActiveCommunity,
      TOP_REVIEWER: topReviewer,
      MOST_REFERRALS: referrals,
      NEWCOMER_OF_MONTH: newcomerScore,
      COMEBACK_CHAMPION: comebackScore,
      ALL_ROUNDER: allRounder,
    }

    const fallbackMetricName = leaderboard.metricName.toLowerCase()
    const fallbackScore = fallbackMetricName.includes("book")
      ? bookingsCurrentCount
      : fallbackMetricName.includes("revenue")
        ? revenue
        : fallbackMetricName.includes("class")
          ? classesCount
          : fallbackMetricName.includes("client")
            ? newClients
            : fallbackMetricName.includes("engage")
              ? socialEngagementRate
              : fallbackMetricName.includes("social")
                ? socialTriggered
                : 0

    const score = metricByCategory[leaderboard.category] ?? fallbackScore

    return {
      score: normalizeScore(score),
      previousScore: null,
      metricsBreakdown: {
        bookingsCurrent: bookingsCurrentCount,
        bookingsPrevious: bookingsPreviousCount,
        revenue: roundTo(revenue, 2),
        classes: classesCount,
        attendanceRate: roundTo(attendanceRate, 2),
        newClients,
        retention: roundTo(retention, 2),
        socialTriggered,
        socialResponded,
        socialBooked,
        socialEngagementRate: roundTo(socialEngagementRate, 2),
        contentConsistencyDays,
        coursesCreated,
        courseEnrollments,
        coursesCompleted,
        averageRating: roundTo(averageRating, 2),
        communityMessages: mostActiveCommunity,
        topReviewer,
        referrals,
        newcomerScore,
        comebackScore,
      } satisfies Prisma.JsonObject,
    }
  }

  const rankingBase = participants.map((participant) => {
    const metric = getMetricValue(participant.id, participant.createdAt)
    return {
      id: participant.id,
      score: metric.score,
      previousScore: metric.previousScore,
      metricsBreakdown: metric.metricsBreakdown,
    }
  })

  rankingBase.sort((left, right) => compareForRanking(left, right, leaderboard.higherIsBetter))

  const entries: ScoreEntry[] = rankingBase.map((row, index) => ({
    studioId:
      leaderboard.participantType === LeaderboardParticipantType.STUDIO
        ? row.id
        : null,
    teacherId:
      leaderboard.participantType === LeaderboardParticipantType.TEACHER
        ? row.id
        : null,
    score: row.score,
    previousScore: row.previousScore,
    rank: index + 1,
    previousRank: null,
    metricsBreakdown: row.metricsBreakdown,
  }))

  await db.$transaction(async (tx) => {
    await tx.leaderboardEntry.deleteMany({
      where: { periodId: period.id },
    })

    if (entries.length > 0) {
      await tx.leaderboardEntry.createMany({
        data: entries.map((entry) => ({
          id: randomUUID(),
          periodId: period.id,
          studioId: entry.studioId,
          teacherId: entry.teacherId,
          score: entry.score,
          previousScore: entry.previousScore,
          rank: entry.rank,
          previousRank: entry.previousRank,
          metricsBreakdown: entry.metricsBreakdown,
          lastUpdated: new Date(),
        })),
      })
    }

    await tx.leaderboard.update({
      where: { id: leaderboard.id },
      data: { lastCalculated: new Date() },
    })
  })

  return { entriesCreated: entries.length }
}

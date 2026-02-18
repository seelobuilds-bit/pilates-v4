import { NextRequest, NextResponse } from "next/server"
import { MessageStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const DEFAULT_DAYS = 30
const MAX_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000
const SENT_LIKE_STATUSES: MessageStatus[] = ["SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED"]

type IntegrityCheck = {
  name: string
  pass: boolean
  details: string
}

function parseDays(value: string | null) {
  if (!value) return DEFAULT_DAYS
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return DEFAULT_DAYS
  return Math.min(MAX_DAYS, Math.max(1, parsed))
}

function buildRange(searchParams: URLSearchParams) {
  const days = parseDays(searchParams.get("days"))
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * DAY_MS)
  return { days, startDate, endDate }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studioId = session.user.studioId
  const { days, startDate, endDate } = buildRange(request.nextUrl.searchParams)
  const socialAccountScope = { OR: [{ studioId }, { teacher: { studioId } }] }
  const checks: IntegrityCheck[] = []

  const [
    reminderAutomations,
    winbackAutomations,
    periodMessages,
    socialTriggered,
    socialResponded,
    socialBooked,
    automations,
    socialFlows,
    recentPeriods,
  ] = await Promise.all([
    db.automation.findMany({
      where: { studioId, trigger: "CLASS_REMINDER" },
      select: { id: true },
    }),
    db.automation.findMany({
      where: { studioId, trigger: "CLIENT_INACTIVE" },
      select: { id: true },
    }),
    db.message.findMany({
      where: {
        studioId,
        direction: "OUTBOUND",
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        clientId: true,
        automationId: true,
      },
    }),
    db.socialMediaFlowEvent.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        flow: { account: socialAccountScope },
      },
    }),
    db.socialMediaFlowEvent.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        responseSent: true,
        flow: { account: socialAccountScope },
      },
    }),
    db.socialMediaFlowEvent.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        converted: true,
        flow: { account: socialAccountScope },
      },
    }),
    db.automation.findMany({
      where: { studioId },
      select: {
        id: true,
        name: true,
        totalSent: true,
        totalDelivered: true,
      },
    }),
    db.socialMediaFlow.findMany({
      where: {
        account: socialAccountScope,
      },
      select: {
        id: true,
        name: true,
        totalTriggered: true,
        totalResponded: true,
        totalBooked: true,
      },
    }),
    db.leaderboardPeriod.findMany({
      where: {
        endDate: {
          gte: new Date(endDate.getTime() - MAX_DAYS * DAY_MS),
        },
        status: {
          in: ["ACTIVE", "COMPLETED"],
        },
      },
      include: {
        leaderboard: {
          select: { id: true, name: true },
        },
        entries: {
          select: {
            id: true,
            rank: true,
            score: true,
            studioId: true,
            teacherId: true,
          },
        },
        winners: {
          select: {
            id: true,
            position: true,
            finalScore: true,
            studioId: true,
            teacherId: true,
          },
        },
      },
    }),
  ])

  const reminderIds = new Set(reminderAutomations.map((automation) => automation.id))
  const winbackIds = new Set(winbackAutomations.map((automation) => automation.id))
  const remindersSent = periodMessages.filter(
    (message) => message.automationId && reminderIds.has(message.automationId)
  ).length
  const winbackClientIds = Array.from(
    new Set(
      periodMessages
        .filter((message) => message.automationId && winbackIds.has(message.automationId))
        .map((message) => message.clientId)
        .filter((clientId): clientId is string => Boolean(clientId))
    )
  )
  const winbackRecovered = winbackClientIds.length
    ? await db.booking.findMany({
        where: {
          studioId,
          clientId: { in: winbackClientIds },
          status: {
            in: ["CONFIRMED", "COMPLETED", "NO_SHOW"],
          },
          classSession: {
            startTime: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
        select: { clientId: true },
        distinct: ["clientId"],
      })
    : []
  const winbackSuccess = winbackRecovered.length

  const automationIds = automations.map((automation) => automation.id)
  const automationSentCounts = automationIds.length
    ? await db.message.groupBy({
        by: ["automationId"],
        where: {
          studioId,
          direction: "OUTBOUND",
          automationId: { in: automationIds },
          status: { in: SENT_LIKE_STATUSES },
        },
        _count: { id: true },
      })
    : []
  const automationSentById = new Map(
    automationSentCounts
      .filter((row): row is typeof row & { automationId: string } => Boolean(row.automationId))
      .map((row) => [row.automationId, row._count.id])
  )

  const automationCounterDrift = automations.filter(
    (automation) => automation.totalSent !== (automationSentById.get(automation.id) || 0)
  )
  const automationDeliveryDrift = automations.filter((automation) => automation.totalDelivered > automation.totalSent)

  checks.push({
    name: "automation_counter_parity",
    pass: automationCounterDrift.length === 0,
    details:
      automationCounterDrift.length === 0
        ? `Checked ${automations.length} automations`
        : `${automationCounterDrift.length} automations have totalSent drift`,
  })
  checks.push({
    name: "automation_delivery_bounds",
    pass: automationDeliveryDrift.length === 0,
    details:
      automationDeliveryDrift.length === 0
        ? "totalDelivered <= totalSent for all automations"
        : `${automationDeliveryDrift.length} automations have totalDelivered > totalSent`,
  })

  const flowIds = socialFlows.map((flow) => flow.id)
  const flowConvertedCounts = flowIds.length
    ? await db.socialMediaFlowEvent.groupBy({
        by: ["flowId"],
        where: {
          flowId: { in: flowIds },
          converted: true,
        },
        _count: { id: true },
      })
    : []
  const convertedByFlowId = new Map(flowConvertedCounts.map((row) => [row.flowId, row._count.id]))

  const flowBookedDrift = socialFlows.filter(
    (flow) => flow.totalBooked > (convertedByFlowId.get(flow.id) || 0)
  )
  const flowResponseDrift = socialFlows.filter((flow) => flow.totalResponded > flow.totalTriggered)

  checks.push({
    name: "social_flow_booked_parity",
    pass: flowBookedDrift.length === 0,
    details:
      flowBookedDrift.length === 0
        ? `Checked ${socialFlows.length} social flows`
        : `${flowBookedDrift.length} flows have totalBooked > converted events`,
  })
  checks.push({
    name: "social_flow_response_bounds",
    pass: flowResponseDrift.length === 0,
    details:
      flowResponseDrift.length === 0
        ? "totalResponded <= totalTriggered for all flows"
        : `${flowResponseDrift.length} flows have totalResponded > totalTriggered`,
  })

  const convertedEventRows = await db.socialMediaFlowEvent.findMany({
    where: {
      converted: true,
      flow: {
        account: socialAccountScope,
      },
    },
    select: {
      id: true,
      bookingId: true,
    },
  })
  const missingBookingIdEvents = convertedEventRows.filter((row) => !row.bookingId)
  const convertedBookingIds = Array.from(
    new Set(convertedEventRows.map((row) => row.bookingId).filter((bookingId): bookingId is string => Boolean(bookingId)))
  )
  const existingBookingIds = convertedBookingIds.length
    ? await db.booking.findMany({
        where: {
          studioId,
          id: {
            in: convertedBookingIds,
          },
        },
        select: { id: true },
      })
    : []
  const existingBookingIdSet = new Set(existingBookingIds.map((booking) => booking.id))
  const orphanBookingEvents = convertedBookingIds.filter((bookingId) => !existingBookingIdSet.has(bookingId))

  checks.push({
    name: "social_conversion_booking_ids",
    pass: missingBookingIdEvents.length === 0,
    details:
      missingBookingIdEvents.length === 0
        ? "All converted social events include bookingId"
        : `${missingBookingIdEvents.length} converted social events missing bookingId`,
  })
  checks.push({
    name: "social_conversion_booking_refs",
    pass: orphanBookingEvents.length === 0,
    details:
      orphanBookingEvents.length === 0
        ? "All converted social events reference existing bookings"
        : `${orphanBookingEvents.length} converted social events reference missing bookings`,
  })

  let invalidRanks = 0
  let duplicatePeriodRanks = 0
  let winnerEntryMismatch = 0
  let winnerScoreMismatch = 0
  let winnerPositionMismatch = 0

  for (const period of recentPeriods) {
    const ranks = period.entries.map((entry) => entry.rank).filter((rank): rank is number => rank != null)
    invalidRanks += ranks.filter((rank) => rank <= 0).length
    duplicatePeriodRanks += ranks.length - new Set(ranks).size

    const entryByParticipant = new Map<string, { rank: number | null; score: number }>()
    for (const entry of period.entries) {
      const participantKey = entry.studioId ? `studio:${entry.studioId}` : entry.teacherId ? `teacher:${entry.teacherId}` : null
      if (participantKey) entryByParticipant.set(participantKey, { rank: entry.rank, score: entry.score })
    }

    for (const winner of period.winners) {
      const participantKey = winner.studioId
        ? `studio:${winner.studioId}`
        : winner.teacherId
          ? `teacher:${winner.teacherId}`
          : null
      if (!participantKey) {
        winnerEntryMismatch += 1
        continue
      }
      const entry = entryByParticipant.get(participantKey)
      if (!entry) {
        winnerEntryMismatch += 1
        continue
      }
      if (Math.abs(entry.score - winner.finalScore) > 0.01) {
        winnerScoreMismatch += 1
      }
      if (entry.rank != null && winner.position !== entry.rank) {
        winnerPositionMismatch += 1
      }
    }
  }

  checks.push({
    name: "leaderboard_positive_ranks",
    pass: invalidRanks === 0,
    details: invalidRanks === 0 ? "No non-positive ranks found" : `${invalidRanks} invalid leaderboard ranks`,
  })
  checks.push({
    name: "leaderboard_unique_period_ranks",
    pass: duplicatePeriodRanks === 0,
    details:
      duplicatePeriodRanks === 0
        ? "No duplicate leaderboard ranks within periods"
        : `${duplicatePeriodRanks} duplicate leaderboard ranks found`,
  })
  checks.push({
    name: "leaderboard_winner_entry_parity",
    pass: winnerEntryMismatch === 0 && winnerScoreMismatch === 0 && winnerPositionMismatch === 0,
    details:
      winnerEntryMismatch === 0 && winnerScoreMismatch === 0 && winnerPositionMismatch === 0
        ? "Winner rows align with leaderboard entries"
        : `winner mismatches: missingEntry=${winnerEntryMismatch}, score=${winnerScoreMismatch}, position=${winnerPositionMismatch}`,
  })

  const failedChecks = checks.filter((check) => !check.pass)

  return NextResponse.json({
    ok: failedChecks.length === 0,
    range: {
      days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    source: {
      marketing: {
        remindersSent,
        winbackSuccess,
      },
      social: {
        totalTriggered: socialTriggered,
        totalResponded: socialResponded,
        totalBooked: socialBooked,
      },
    },
    checks,
    summary: {
      checkCount: checks.length,
      failedCheckCount: failedChecks.length,
    },
  })
}


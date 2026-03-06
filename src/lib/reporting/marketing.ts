import { db } from "../db"
import { isAttendedBookingStatus } from "./attendance"
import { ratioPercentage } from "./metrics"

type MessageLike = {
  channel: string | null
  status: string | null
  clientId: string | null
  campaignId: string | null
  automationId: string | null
  openedAt: Date | null
  clickedAt: Date | null
}

type AutomationLike = {
  id: string
}

type BookingLike = {
  status: string
}

type CampaignBucket = {
  sent: number
  opened: number
  clicked: number
  clients: Set<string>
}

type MarketingInsightType = "info" | "positive" | "warning"

export function buildMarketingInsights({
  emailsSent,
  emailOpenRate,
  previousEmailOpenRate,
  bookingsFromEmail,
  noShowRate,
  previousNoShowRate,
}: {
  emailsSent: number
  emailOpenRate: number
  previousEmailOpenRate: number
  bookingsFromEmail: number
  noShowRate: number
  previousNoShowRate: number
}) {
  if (emailsSent <= 0) {
    return [
      { type: "info" as const, message: "No outbound email activity yet in this period." },
      { type: "info" as const, message: "Launch a campaign or automation to start collecting marketing performance data." },
    ]
  }

  return [
    {
      type: (emailOpenRate >= previousEmailOpenRate ? "positive" : "warning") as MarketingInsightType,
      message: `Email open rate is ${emailOpenRate}% (${emailOpenRate - previousEmailOpenRate >= 0 ? "+" : ""}${(
        emailOpenRate - previousEmailOpenRate
      ).toFixed(1)}pp vs previous period).`,
    },
    {
      type: (bookingsFromEmail > 0 ? "positive" : "info") as MarketingInsightType,
      message:
        bookingsFromEmail > 0
          ? `${bookingsFromEmail} email recipients booked at least once in this period.`
          : "No email recipients have booked in this period yet.",
    },
    {
      type: (noShowRate <= previousNoShowRate ? "positive" : "warning") as MarketingInsightType,
      message: `No-show rate is ${noShowRate}% (${noShowRate <= previousNoShowRate ? "improved" : "up"} from ${previousNoShowRate}%).`,
    },
  ]
}

export function buildCampaignRows({
  campaignBuckets,
  campaignNameById,
  bookingsByClientId,
}: {
  campaignBuckets: Map<string, CampaignBucket>
  campaignNameById: Map<string, string>
  bookingsByClientId: Map<string, number>
}) {
  return Array.from(campaignBuckets.entries())
    .map(([campaignId, bucket]) => {
      const attributedBookings = Array.from(bucket.clients).filter(
        (clientId) => (bookingsByClientId.get(clientId) || 0) > 0
      ).length
      return {
        id: campaignId,
        name: campaignNameById.get(campaignId) || "Campaign",
        sent: bucket.sent,
        opened: bucket.opened,
        clicked: bucket.clicked,
        bookings: attributedBookings,
      }
    })
    .sort((a, b) => b.sent - a.sent || a.name.localeCompare(b.name))
    .slice(0, 10)
}

export async function buildMarketingSummary({
  studioId,
  startDate,
  reportEndDate,
  periodMessages,
  previousPeriodMessages,
  reminderAutomations,
  winbackAutomations,
  bookings,
  previousBookings,
}: {
  studioId: string
  startDate: Date
  reportEndDate: Date
  periodMessages: MessageLike[]
  previousPeriodMessages: MessageLike[]
  reminderAutomations: AutomationLike[]
  winbackAutomations: AutomationLike[]
  bookings: BookingLike[]
  previousBookings: BookingLike[]
}) {
  const periodEmailMessages = periodMessages.filter((message) => message.channel === "EMAIL")
  const previousPeriodEmailMessages = previousPeriodMessages.filter((message) => message.channel === "EMAIL")
  const emailsSent = periodEmailMessages.length
  const openedEmails = periodEmailMessages.filter(
    (message) => message.openedAt || message.status === "OPENED" || message.status === "CLICKED"
  ).length
  const clickedEmails = periodEmailMessages.filter(
    (message) => message.clickedAt || message.status === "CLICKED"
  ).length
  const previousEmailsSent = previousPeriodEmailMessages.length
  const previousOpenedEmails = previousPeriodEmailMessages.filter(
    (message) => message.openedAt || message.status === "OPENED" || message.status === "CLICKED"
  ).length
  const previousClickedEmails = previousPeriodEmailMessages.filter(
    (message) => message.clickedAt || message.status === "CLICKED"
  ).length

  const emailOpenRate = ratioPercentage(openedEmails, emailsSent, 1)
  const emailClickRate = ratioPercentage(clickedEmails, emailsSent, 1)
  const previousEmailOpenRate = ratioPercentage(previousOpenedEmails, previousEmailsSent, 1)
  const previousEmailClickRate = ratioPercentage(previousClickedEmails, previousEmailsSent, 1)

  const emailRecipientClientIds = Array.from(
    new Set(
      periodEmailMessages
        .map((message) => message.clientId)
        .filter((clientId): clientId is string => Boolean(clientId))
    )
  )

  const campaignIds = Array.from(
    new Set(
      periodEmailMessages
        .map((message) => message.campaignId)
        .filter((campaignId): campaignId is string => Boolean(campaignId))
    )
  )

  const reminderAutomationIds = new Set(reminderAutomations.map((automation) => automation.id))
  const remindersSent = periodMessages.filter(
    (message) => message.automationId && reminderAutomationIds.has(message.automationId)
  ).length

  const winbackAutomationIds = new Set(winbackAutomations.map((automation) => automation.id))
  const winbackClientIds = Array.from(
    new Set(
      periodMessages
        .filter((message) => message.automationId && winbackAutomationIds.has(message.automationId))
        .map((message) => message.clientId)
        .filter((clientId): clientId is string => Boolean(clientId))
    )
  )

  const [bookingsByEmailRecipient, campaignDefinitions, winbackRecoveredClients] = await Promise.all([
    emailRecipientClientIds.length
      ? db.booking.groupBy({
          by: ["clientId"],
          where: {
            studioId,
            clientId: {
              in: emailRecipientClientIds,
            },
            status: {
              in: ["CONFIRMED", "COMPLETED", "NO_SHOW"],
            },
            classSession: {
              startTime: {
                gte: startDate,
                lt: reportEndDate,
              },
            },
          },
          _count: {
            clientId: true,
          },
        })
      : Promise.resolve([]),
    campaignIds.length
      ? db.campaign.findMany({
          where: {
            studioId,
            id: {
              in: campaignIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : Promise.resolve([]),
    winbackClientIds.length
      ? db.booking.findMany({
          where: {
            studioId,
            clientId: {
              in: winbackClientIds,
            },
            status: {
              in: ["CONFIRMED", "COMPLETED", "NO_SHOW"],
            },
            classSession: {
              startTime: {
                gte: startDate,
                lt: reportEndDate,
              },
            },
          },
          select: {
            clientId: true,
          },
          distinct: ["clientId"],
        })
      : Promise.resolve([]),
  ])

  const bookingsByClientId = new Map<string, number>()
  for (const row of bookingsByEmailRecipient) {
    bookingsByClientId.set(row.clientId, row._count.clientId)
  }

  const campaignBuckets = new Map<string, CampaignBucket>()
  for (const message of periodEmailMessages) {
    if (!message.campaignId) continue
    const existing = campaignBuckets.get(message.campaignId) || {
      sent: 0,
      opened: 0,
      clicked: 0,
      clients: new Set<string>(),
    }
    existing.sent += 1
    if (message.openedAt || message.status === "OPENED" || message.status === "CLICKED") {
      existing.opened += 1
    }
    if (message.clickedAt || message.status === "CLICKED") {
      existing.clicked += 1
    }
    if (message.clientId) {
      existing.clients.add(message.clientId)
    }
    campaignBuckets.set(message.campaignId, existing)
  }

  const campaignNameById = new Map(campaignDefinitions.map((campaign) => [campaign.id, campaign.name]))
  const campaignRows = buildCampaignRows({
    campaignBuckets,
    campaignNameById,
    bookingsByClientId,
  })

  const bookingsFromEmail = bookingsByEmailRecipient.length
  const winbackSuccess = winbackRecoveredClients.length

  const attendedBookingsThisPeriod = bookings.filter((booking) => isAttendedBookingStatus(booking.status))
  const attendedBookingsPreviousPeriod = previousBookings.filter((booking) => isAttendedBookingStatus(booking.status))
  const noShowRate = ratioPercentage(
    attendedBookingsThisPeriod.filter((booking) => booking.status === "NO_SHOW").length,
    attendedBookingsThisPeriod.length,
    1
  )
  const previousNoShowRate = ratioPercentage(
    attendedBookingsPreviousPeriod.filter((booking) => booking.status === "NO_SHOW").length,
    attendedBookingsPreviousPeriod.length,
    1
  )

  return {
    emailsSent,
    emailOpenRate,
    emailClickRate,
    previousEmailOpenRate,
    previousEmailClickRate,
    bookingsFromEmail,
    remindersSent,
    noShowRate,
    previousNoShowRate,
    winbackSuccess,
    campaigns: campaignRows,
    insights: buildMarketingInsights({
      emailsSent,
      emailOpenRate,
      previousEmailOpenRate,
      bookingsFromEmail,
      noShowRate,
      previousNoShowRate,
    }),
  }
}

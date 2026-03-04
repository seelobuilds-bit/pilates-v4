import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"

export async function fetchMarketingAndSocialInputs(args: {
  studioId: string
  startDate: Date
  reportEndDate: Date
  previousStartDate: Date
}) {
  const { studioId, startDate, reportEndDate, previousStartDate } = args

  const [periodMessages, previousPeriodMessages, reminderAutomations, winbackAutomations] = await runDbQueries([
    () =>
      db.message.findMany({
        where: {
          studioId,
          direction: "OUTBOUND",
          createdAt: {
            gte: startDate,
            lt: reportEndDate,
          },
        },
        select: {
          id: true,
          channel: true,
          status: true,
          clientId: true,
          campaignId: true,
          automationId: true,
          openedAt: true,
          clickedAt: true,
        },
      }),
    () =>
      db.message.findMany({
        where: {
          studioId,
          direction: "OUTBOUND",
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
        select: {
          id: true,
          channel: true,
          status: true,
          clientId: true,
          campaignId: true,
          automationId: true,
          openedAt: true,
          clickedAt: true,
        },
      }),
    () =>
      db.automation.findMany({
        where: {
          studioId,
          trigger: "CLASS_REMINDER",
        },
        select: {
          id: true,
        },
      }),
    () =>
      db.automation.findMany({
        where: {
          studioId,
          trigger: "CLIENT_INACTIVE",
        },
        select: {
          id: true,
        },
      }),
  ])

  const [activeSocialFlows, totalSocialTriggered, totalSocialResponded, totalSocialBooked] = await runDbQueries([
    () =>
      db.socialMediaFlow.count({
        where: {
          isActive: true,
          account: {
            OR: [{ studioId }, { teacher: { studioId } }],
          },
        },
      }),
    () =>
      db.socialMediaFlowEvent.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: reportEndDate,
          },
          flow: {
            account: {
              OR: [{ studioId }, { teacher: { studioId } }],
            },
          },
        },
      }),
    () =>
      db.socialMediaFlowEvent.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: reportEndDate,
          },
          responseSent: true,
          flow: {
            account: {
              OR: [{ studioId }, { teacher: { studioId } }],
            },
          },
        },
      }),
    () =>
      db.socialMediaFlowEvent.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: reportEndDate,
          },
          converted: true,
          flow: {
            account: {
              OR: [{ studioId }, { teacher: { studioId } }],
            },
          },
        },
      }),
  ])

  return {
    periodMessages,
    previousPeriodMessages,
    reminderAutomations,
    winbackAutomations,
    activeSocialFlows,
    totalSocialTriggered,
    totalSocialResponded,
    totalSocialBooked,
  }
}

import { BookingStatus } from "@prisma/client"
import { db } from "@/lib/db"
import {
  buildActiveClientVisitIndex,
  buildAtRiskCandidates,
  buildClientSummary,
} from "./retention"
import { buildRetentionSummary } from "./retention-summary"

export const ATTENDED_BOOKING_STATUS_LIST: BookingStatus[] = ["CONFIRMED", "COMPLETED", "NO_SHOW"]

type StudioClientLike = {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  credits: number
  createdAt: Date
}

type ActiveClientVisitRow = {
  clientId: string
  classSession: {
    startTime: Date
  }
}

type CancelledBookingLike = {
  cancellationReason: string | null
}

export async function fetchActiveClientVisitRows(args: {
  studioId: string
  activityLookbackStart: Date
  reportEndDate: Date
}) {
  const { studioId, activityLookbackStart, reportEndDate } = args
  return db.booking.findMany({
    where: {
      studioId,
      status: {
        in: ATTENDED_BOOKING_STATUS_LIST,
      },
      client: {
        isActive: true,
      },
      classSession: {
        startTime: {
          gte: activityLookbackStart,
          lt: reportEndDate,
        },
      },
    },
    select: {
      clientId: true,
      classSession: {
        select: {
          startTime: true,
        },
      },
    },
    orderBy: {
      classSession: {
        startTime: "desc",
      },
    },
  })
}

export function buildRetentionAndClientSummary(args: {
  studioClients: StudioClientLike[]
  activeClientVisitRows: ActiveClientVisitRow[]
  cancelledBookingsInPeriod: CancelledBookingLike[]
  reportEndDate: Date
  totalClients: number
  newClients: number
  activeClients: number
  churnedClients: number
}) {
  const {
    studioClients,
    activeClientVisitRows,
    cancelledBookingsInPeriod,
    reportEndDate,
    totalClients,
    newClients,
    activeClients,
    churnedClients,
  } = args

  const { visitCountByClientId, lastVisitByClientId, recentlyActiveClientIds } = buildActiveClientVisitIndex(
    activeClientVisitRows,
    reportEndDate
  )

  const atRiskCandidates = buildAtRiskCandidates(studioClients, lastVisitByClientId, visitCountByClientId, reportEndDate)
  const activeClientsList = studioClients.filter((client) => client.isActive)

  return {
    clients: buildClientSummary(totalClients, newClients, activeClients, churnedClients),
    retention: buildRetentionSummary({
      atRiskCandidates,
      activeClientsList,
      recentlyActiveClientIds,
      cancelledBookingsInPeriod,
      reportEndDate,
      churnedClients,
      totalClients,
    }),
  }
}

import { buildReportRangePayload } from "./date-range"
import { buildClientSummary } from "./retention"
import { buildEmptyChurnMeta } from "./retention-churn"

function buildEmptyRevenueSummary() {
  return {
    total: 0,
    previousTotal: 0,
    byLocation: [] as Array<{ location: string; revenue: number; percentage: number }>,
    byClassType: [] as Array<{ classType: string; revenue: number; percentage: number }>,
    monthly: [] as Array<{ month: string; revenue: number }>,
  }
}

function buildEmptyRetentionSummary(includeChurnMeta: boolean) {
  const base = {
    atRiskClients: 0,
    atRiskList: [] as Array<{
      id: string
      name: string
      email: string
      lastVisit: string | null
      visits: number
      status: "high-risk" | "medium-risk"
    }>,
    membershipBreakdown: [] as Array<{ status: string; count: number; percentage: number }>,
    churnReasons: [] as Array<{ reason: string; count: number; percentage: number }>,
    cohortRetention: [] as Array<{ month: string; retained: number; churned: number }>,
  }

  if (!includeChurnMeta) {
    return base
  }

  return {
    ...base,
    ...buildEmptyChurnMeta(),
  }
}

function buildEmptyClassesSummary() {
  return {
    total: 0,
    totalCapacity: 0,
    totalAttendance: 0,
    averageFill: 0,
    byLocation: [] as Array<{ location: string; classes: number; fillRate: number }>,
    byTeacher: [] as Array<{ teacher: string; classes: number; fillRate: number }>,
    byTimeSlot: [] as Array<{ time: string; classes: number }>,
    byDay: [] as Array<{ day: string; classes: number }>,
    topClasses: [] as Array<{ className: string; bookings: number; attendanceRate: number }>,
    underperforming: [] as Array<{ className: string; fillRate: number }>,
  }
}

function buildEmptyBookingsSummary() {
  return {
    total: 0,
    uniqueClients: 0,
    newClientBookings: 0,
    averageBookingsPerClient: 0,
    byStatus: [] as Array<{ status: string; count: number; percentage: number }>,
  }
}

function buildEmptyMarketingSummary(message: string) {
  return {
    emailsSent: 0,
    emailOpenRate: 0,
    emailClickRate: 0,
    previousEmailOpenRate: 0,
    previousEmailClickRate: 0,
    bookingsFromEmail: 0,
    remindersSent: 0,
    noShowRate: 0,
    previousNoShowRate: 0,
    winbackSuccess: 0,
    campaigns: [] as Array<{
      id: string
      name: string
      sent: number
      opened: number
      bookings: number
      openRate: number
    }>,
    insights: [{ type: "warning" as const, message }],
  }
}

function buildEmptySocialSummary() {
  return {
    activeFlows: 0,
    totalTriggered: 0,
    totalResponded: 0,
    totalBooked: 0,
    conversionRate: 0,
  }
}

export function buildPartialReportsPayload(params: {
  totalClients: number
  newClients: number
  activeClients: number
  churnedClients: number
  days: number
  startDate: Date
  endDate: Date
  warningMessage: string
  includeChurnMeta?: boolean
}) {
  const {
    totalClients,
    newClients,
    activeClients,
    churnedClients,
    days,
    startDate,
    endDate,
    warningMessage,
    includeChurnMeta = false,
  } = params

  return {
    revenue: buildEmptyRevenueSummary(),
    clients: buildClientSummary(totalClients, newClients, activeClients, churnedClients),
    instructors: [] as Array<{
      id: string
      name: string
      classes: number
      avgFill: number
      revenue: number
      rating: number | null
      retention: number
      trend: "up" | "down" | "stable"
      specialties: string[]
    }>,
    retention: buildEmptyRetentionSummary(includeChurnMeta),
    classes: buildEmptyClassesSummary(),
    bookings: buildEmptyBookingsSummary(),
    marketing: buildEmptyMarketingSummary(warningMessage),
    social: buildEmptySocialSummary(),
    range: buildReportRangePayload(days, startDate, endDate),
    partial: true,
  }
}

import { ratioPercentage } from "./metrics"
import { calculateChurnRate } from "./retention"

type ActiveClientLike = {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: Date
  credits: number
}

type AtRiskCandidateLike = {
  id: string
  name: string
  email: string
  lastVisit: Date | null
  visits: number
  status: string
}

type CancelledBookingLike = {
  cancellationReason: string | null
}

type RetentionSummary = {
  atRiskClients: number
  atRiskList: Array<{
    id: string
    name: string
    email: string
    lastVisit: string
    visits: number
    status: string
  }>
  membershipBreakdown: Array<{
    type: string
    count: number
    percent: number
  }>
  churnReasons: Array<{
    reason: string
    count: number
  }>
  cohortRetention: Array<{
    cohort: string
    retained: number
  }>
  churnRate: number
  churnDefinition: string
}

export function buildRetentionSummary({
  atRiskCandidates,
  activeClientsList,
  recentlyActiveClientIds,
  cancelledBookingsInPeriod,
  reportEndDate,
  churnedClients,
  totalClients,
}: {
  atRiskCandidates: AtRiskCandidateLike[]
  activeClientsList: ActiveClientLike[]
  recentlyActiveClientIds: Set<string>
  cancelledBookingsInPeriod: CancelledBookingLike[]
  reportEndDate: Date
  churnedClients: number
  totalClients: number
}): RetentionSummary {
  const atRiskList = atRiskCandidates.slice(0, 10).map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    lastVisit: client.lastVisit
      ? client.lastVisit.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never",
    visits: client.visits,
    status: client.status,
  }))

  const cohortRanges = [
    { label: "0-30 days", min: 0, max: 30 },
    { label: "31-90 days", min: 31, max: 90 },
    { label: "91-180 days", min: 91, max: 180 },
    { label: "181+ days", min: 181, max: Number.POSITIVE_INFINITY },
  ]

  const cohortBuckets = cohortRanges.map((range) => ({
    cohort: range.label,
    total: 0,
    retained: 0,
  }))

  for (const client of activeClientsList) {
    const ageInDays = Math.floor((reportEndDate.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const bucketIndex = cohortRanges.findIndex((range) => ageInDays >= range.min && ageInDays <= range.max)
    if (bucketIndex < 0) continue
    cohortBuckets[bucketIndex].total += 1
    if (recentlyActiveClientIds.has(client.id)) {
      cohortBuckets[bucketIndex].retained += 1
    }
  }

  const cohortRetention = cohortBuckets.map((bucket) => ({
    cohort: bucket.cohort,
    retained: ratioPercentage(bucket.retained, bucket.total, 1),
  }))

  const cancellationReasonCounts = new Map<string, number>()
  for (const booking of cancelledBookingsInPeriod) {
    const reason = booking.cancellationReason?.trim() || "No reason provided"
    cancellationReasonCounts.set(reason, (cancellationReasonCounts.get(reason) || 0) + 1)
  }
  const churnReasons = Array.from(cancellationReasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const membershipBuckets = [
    { type: "No credits", count: 0 },
    { type: "1-4 credits", count: 0 },
    { type: "5-9 credits", count: 0 },
    { type: "10+ credits", count: 0 },
  ]
  for (const client of activeClientsList) {
    if (client.credits <= 0) membershipBuckets[0].count += 1
    else if (client.credits <= 4) membershipBuckets[1].count += 1
    else if (client.credits <= 9) membershipBuckets[2].count += 1
    else membershipBuckets[3].count += 1
  }
  const membershipBreakdown = membershipBuckets.map((bucket) => ({
    type: bucket.type,
    count: bucket.count,
    percent: ratioPercentage(bucket.count, activeClientsList.length, 1),
  }))

  return {
    atRiskClients: atRiskCandidates.length,
    atRiskList,
    membershipBreakdown,
    churnReasons,
    cohortRetention,
    churnRate: calculateChurnRate(churnedClients, totalClients, 1),
    churnDefinition: "inactive clients / total clients",
  }
}

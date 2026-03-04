import { ratioPercentage } from "./metrics"

type SocialSummary = {
  activeFlows: number
  totalTriggered: number
  totalResponded: number
  totalBooked: number
  conversionRate: number
}

export function buildSocialSummary({
  activeFlows,
  totalTriggered,
  totalResponded,
  totalBooked,
}: {
  activeFlows: number
  totalTriggered: number
  totalResponded: number
  totalBooked: number
}): SocialSummary {
  return {
    activeFlows,
    totalTriggered,
    totalResponded,
    totalBooked,
    conversionRate: ratioPercentage(totalBooked, totalTriggered, 1),
  }
}

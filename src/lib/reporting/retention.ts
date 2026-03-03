import { ratioPercentage } from "./metrics"

export function countRepeatClients(clientVisitCounts: Map<string, number>) {
  return Array.from(clientVisitCounts.values()).filter((count) => count > 1).length
}

export function calculateRepeatClientRetentionRate(
  clientVisitCounts: Map<string, number>,
  decimals = 1
) {
  return ratioPercentage(countRepeatClients(clientVisitCounts), clientVisitCounts.size, decimals)
}

export function calculateChurnRate(churnedClients: number, totalClients: number, decimals = 1) {
  return ratioPercentage(churnedClients, totalClients, decimals)
}

export function getClientRiskStatus(lastVisit: Date | null, reportEndDate: Date) {
  const riskCutoff = new Date(reportEndDate)
  riskCutoff.setDate(riskCutoff.getDate() - 14)

  const highRiskCutoff = new Date(reportEndDate)
  highRiskCutoff.setDate(highRiskCutoff.getDate() - 30)

  const isAtRisk = !lastVisit || lastVisit < riskCutoff
  const status = !lastVisit || lastVisit < highRiskCutoff ? "high-risk" : "medium-risk"

  return {
    isAtRisk,
    status,
  }
}


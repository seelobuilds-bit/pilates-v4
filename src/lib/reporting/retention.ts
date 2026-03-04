import { ratioPercentage } from "./metrics"

type ActiveClientLike = {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
}

type ActiveClientVisitLike = {
  clientId: string
  classSession: {
    startTime: Date
  }
}

export type AtRiskCandidate = {
  id: string
  name: string
  email: string
  lastVisit: Date | null
  visits: number
  isAtRisk: boolean
  status: "high-risk" | "medium-risk"
}

export function countRepeatClients(clientVisitCounts: Map<string, number>) {
  return Array.from(clientVisitCounts.values()).filter((count) => count > 1).length
}

export function buildClientVisitCounts<T>(
  rows: T[],
  resolveClientId: (row: T) => string | null | undefined
) {
  const clientVisitCounts = new Map<string, number>()
  for (const row of rows) {
    const clientId = resolveClientId(row)
    if (!clientId) continue
    clientVisitCounts.set(clientId, (clientVisitCounts.get(clientId) || 0) + 1)
  }
  return clientVisitCounts
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

export function getClientRiskStatus(
  lastVisit: Date | null,
  reportEndDate: Date
): { isAtRisk: boolean; status: "high-risk" | "medium-risk" } {
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

export function buildActiveClientVisitIndex(
  visits: ActiveClientVisitLike[],
  reportEndDate: Date
) {
  const recentActivityCutoff = new Date(reportEndDate)
  recentActivityCutoff.setDate(recentActivityCutoff.getDate() - 30)

  const visitCountByClientId = new Map<string, number>()
  const lastVisitByClientId = new Map<string, Date>()
  const recentlyActiveClientIds = new Set<string>()

  for (const visit of visits) {
    visitCountByClientId.set(visit.clientId, (visitCountByClientId.get(visit.clientId) || 0) + 1)
    if (!lastVisitByClientId.has(visit.clientId)) {
      lastVisitByClientId.set(visit.clientId, visit.classSession.startTime)
    }
    if (visit.classSession.startTime >= recentActivityCutoff) {
      recentlyActiveClientIds.add(visit.clientId)
    }
  }

  return {
    visitCountByClientId,
    lastVisitByClientId,
    recentlyActiveClientIds,
  }
}

export function buildAtRiskCandidates(
  clients: ActiveClientLike[],
  lastVisitByClientId: Map<string, Date>,
  visitCountByClientId: Map<string, number>,
  reportEndDate: Date
): AtRiskCandidate[] {
  return clients
    .filter((client) => client.isActive)
    .map((client) => {
      const lastVisit = lastVisitByClientId.get(client.id) || null
      const visits = visitCountByClientId.get(client.id) || 0
      const { isAtRisk, status } = getClientRiskStatus(lastVisit, reportEndDate)
      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        lastVisit,
        visits,
        isAtRisk,
        status,
      }
    })
    .filter((client) => client.isAtRisk)
    .sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return a.name.localeCompare(b.name)
      if (!a.lastVisit) return -1
      if (!b.lastVisit) return 1
      return a.lastVisit.getTime() - b.lastVisit.getTime()
    })
}

export function buildClientSummary(
  totalClients: number,
  newClients: number,
  activeClients: number,
  churnedClients: number
) {
  return {
    total: totalClients,
    new: newClients,
    active: activeClients,
    churned: churnedClients,
  }
}

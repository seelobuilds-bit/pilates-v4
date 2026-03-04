export type ClientSummaryCounts = {
  totalClients: number
  activeClients: number
  churnedClients: number
  newClients: number
}

export function mapClientSummaryCountResults(results: {
  totalClients: number
  activeClients: number
  churnedClients: number
  newClients: number
}): ClientSummaryCounts {
  return {
    totalClients: results.totalClients,
    activeClients: results.activeClients,
    churnedClients: results.churnedClients,
    newClients: results.newClients,
  }
}

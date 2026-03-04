import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"
import { mapClientSummaryCountResults } from "./client-summary-counts"

type ClientSummaryCountQueries = [
  () => Promise<number>,
  () => Promise<number>,
  () => Promise<number>,
  () => Promise<number>,
]

export function buildClientSummaryCountQueries(params: {
  studioId: string
  startDate: Date
  endDate: Date
}): ClientSummaryCountQueries {
  const { studioId, startDate, endDate } = params
  return [
    () => db.client.count({ where: { studioId } }),
    () => db.client.count({ where: { studioId, isActive: true } }),
    () => db.client.count({ where: { studioId, isActive: false } }),
    () =>
      db.client.count({
        where: {
          studioId,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
  ]
}

export async function fetchClientSummaryCounts(params: {
  studioId: string
  startDate: Date
  endDate: Date
}) {
  const [totalClients, activeClients, churnedClients, newClients] = await runDbQueries(
    buildClientSummaryCountQueries(params)
  )
  return mapClientSummaryCountResults({
    totalClients,
    activeClients,
    churnedClients,
    newClients,
  })
}

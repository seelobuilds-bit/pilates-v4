import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"

export async function fetchClientSummaryCounts(params: {
  studioId: string
  startDate: Date
  endDate: Date
}) {
  const { studioId, startDate, endDate } = params
  const [totalClients, activeClients, churnedClients, newClients] = await runDbQueries([
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
  ])

  return {
    totalClients,
    activeClients,
    churnedClients,
    newClients,
  }
}

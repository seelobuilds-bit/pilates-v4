import { NextResponse } from "next/server"
import { buildPartialReportsPayload } from "./fallback"
import { fetchClientSummaryCounts } from "./client-summary-query"

export async function buildStudioReportFallbackResponse(args: {
  studioId: string
  days: number
  startDate: Date
  reportEndDate: Date
}) {
  const { studioId, days, startDate, reportEndDate } = args

  try {
    const { totalClients, activeClients, churnedClients, newClients } = await fetchClientSummaryCounts({
      studioId,
      startDate,
      endDate: reportEndDate,
    })

    return NextResponse.json(
      buildPartialReportsPayload({
        totalClients,
        newClients,
        activeClients,
        churnedClients,
        days,
        startDate,
        endDate: reportEndDate,
        warningMessage: "Partial reports payload returned due to data timeout. Retry shortly.",
      })
    )
  } catch (fallbackError) {
    console.error("Failed to build fallback reports payload:", fallbackError)
    return NextResponse.json(
      buildPartialReportsPayload({
        totalClients: 0,
        newClients: 0,
        activeClients: 0,
        churnedClients: 0,
        days,
        startDate,
        endDate: reportEndDate,
        warningMessage: "Reports are temporarily degraded. Retry in a moment.",
        includeChurnMeta: true,
      })
    )
  }
}

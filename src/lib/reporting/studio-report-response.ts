import { NextResponse } from "next/server"
import { buildPartialReportsPayload } from "@/lib/reporting/fallback"
import { fetchClientSummaryCounts } from "@/lib/reporting/client-summary-query"
import { loadStudioReportData } from "@/lib/reporting/studio-report-loader"
import { runStudioReport } from "@/lib/reporting/studio-report-runner"

export async function buildStudioReportResponse(args: {
  studioId: string
  days: number
  startDate: Date
  reportEndDate: Date
  previousStartDate: Date
}) {
  const { studioId, days, startDate, reportEndDate, previousStartDate } = args

  try {
    const data = await loadStudioReportData({
      studioId,
      startDate,
      reportEndDate,
      previousStartDate,
    })

    return runStudioReport({
      studioId,
      days,
      startDate,
      reportEndDate,
      data,
    })
  } catch (error) {
    console.error("Failed to load full reports payload:", error)

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
}

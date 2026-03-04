import { buildStudioReportFallbackResponse } from "@/lib/reporting/studio-report-fallback-response"
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
    return buildStudioReportFallbackResponse({
      studioId,
      days,
      startDate,
      reportEndDate,
    })
  }
}

import {
  fetchStudioReportBaseData,
  fetchStudioReportClassSessionsWindow,
} from "./studio-report-base-query"

export async function loadMobileOwnerReportData(args: {
  studioId: string
  currentStart: Date
  previousStart: Date
  periodEnd: Date
}) {
  const { studioId, currentStart, previousStart, periodEnd } = args

  const [currentBase, previousSessions] = await Promise.all([
    fetchStudioReportBaseData({
      studioId,
      startDate: currentStart,
      reportEndDate: periodEnd,
      previousStartDate: previousStart,
    }),
    fetchStudioReportClassSessionsWindow({
      studioId,
      startDate: previousStart,
      endDate: currentStart,
    }),
  ])

  return {
    currentBase,
    previousSessions,
  }
}

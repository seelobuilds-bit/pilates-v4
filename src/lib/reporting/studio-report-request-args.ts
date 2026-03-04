import { resolveStudioReportRangeFromSearchParams } from "./studio-report-request"

export function buildStudioReportRequestArgs(studioId: string, searchParams: URLSearchParams) {
  const { days, startDate, reportEndDate, previousStartDate } =
    resolveStudioReportRangeFromSearchParams(searchParams)
  return {
    studioId,
    days,
    startDate,
    reportEndDate,
    previousStartDate,
  }
}

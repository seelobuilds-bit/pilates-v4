import { resolveDefaultStudioReportRange } from "./date-range"

export function resolveStudioReportRangeFromSearchParams(searchParams: URLSearchParams) {
  return resolveDefaultStudioReportRange({
    days: searchParams.get("days"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
  })
}

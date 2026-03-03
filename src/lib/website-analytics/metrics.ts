import { roundTo } from "../reporting/metrics"

export function summarizeWebsiteOverview(totalPageViews: number, uniqueVisitors: number, totalConversions: number) {
  const conversionRate =
    uniqueVisitors > 0 ? String(roundTo((totalConversions / uniqueVisitors) * 100, 1)) : "0"

  const avgPagesPerVisit = uniqueVisitors > 0 ? String(roundTo(totalPageViews / uniqueVisitors, 1)) : "0"

  return {
    totalPageViews,
    uniqueVisitors,
    totalConversions,
    conversionRate,
    avgPagesPerVisit,
  }
}

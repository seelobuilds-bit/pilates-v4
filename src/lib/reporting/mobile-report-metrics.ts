import { roundTo } from "./metrics"

export type MobileMetricFormat = "number" | "currency" | "percent"

export type MobileReportMetric = {
  id: string
  label: string
  value: number
  previousValue: number
  changePct: number
  format: MobileMetricFormat
}

export function calcMobileMetricChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return roundTo(((current - previous) / previous) * 100, 1)
}

export function buildMobileMetric(
  id: string,
  label: string,
  format: MobileMetricFormat,
  value: number,
  previousValue: number
): MobileReportMetric {
  return {
    id,
    label,
    value,
    previousValue,
    changePct: calcMobileMetricChange(value, previousValue),
    format,
  }
}

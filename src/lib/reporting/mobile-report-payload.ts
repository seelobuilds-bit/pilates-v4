import { type MobileReportMetric } from "./mobile-report-metrics"

export type MobileReportsPayload = {
  role: "OWNER" | "TEACHER" | "CLIENT"
  studio: {
    id: string
    name: string
    subdomain: string
    primaryColor: string | null
    currency: string | null
  }
  periodDays: number
  generatedAt: string
  range: {
    start: string
    end: string
  }
  metrics: MobileReportMetric[]
  highlights: Array<{ label: string; value: string }>
  series: Array<{
    label: string
    start: string
    end: string
    metrics: Record<string, number>
  }>
}

export function buildMobileReportsPayload(args: {
  role: MobileReportsPayload["role"]
  studio: MobileReportsPayload["studio"]
  periodDays: number
  periodEnd: Date
  rangeStart: Date
  rangeEnd: Date
  metrics: MobileReportMetric[]
  highlights: MobileReportsPayload["highlights"]
  series: MobileReportsPayload["series"]
}): MobileReportsPayload {
  return {
    role: args.role,
    studio: args.studio,
    periodDays: args.periodDays,
    generatedAt: args.periodEnd.toISOString(),
    range: {
      start: args.rangeStart.toISOString(),
      end: args.rangeEnd.toISOString(),
    },
    metrics: args.metrics,
    highlights: args.highlights,
    series: args.series,
  }
}

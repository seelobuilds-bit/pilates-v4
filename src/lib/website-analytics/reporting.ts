export type WebsiteAnalyticsPeriod = "24h" | "7d" | "30d" | "90d"

const DEFAULT_PERIOD: WebsiteAnalyticsPeriod = "7d"
const ALLOWED_PERIODS = new Set<WebsiteAnalyticsPeriod>(["24h", "7d", "30d", "90d"])

export function resolveWebsiteAnalyticsRange(
  requestedPeriod: string | null | undefined,
  referenceDate: Date = new Date()
) {
  const period = ALLOWED_PERIODS.has((requestedPeriod || "") as WebsiteAnalyticsPeriod)
    ? ((requestedPeriod || "") as WebsiteAnalyticsPeriod)
    : DEFAULT_PERIOD

  const endDate = new Date(referenceDate)
  const startDate = new Date(endDate)
  switch (period) {
    case "24h":
      startDate.setHours(startDate.getHours() - 24)
      break
    case "7d":
      startDate.setDate(startDate.getDate() - 7)
      break
    case "30d":
      startDate.setDate(startDate.getDate() - 30)
      break
    case "90d":
      startDate.setDate(startDate.getDate() - 90)
      break
  }

  return { period, startDate, endDate }
}

export function toSafeNumber(value: unknown) {
  if (typeof value === "bigint") return Number(value)
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function extractGroupCount(value: unknown) {
  if (!value || typeof value !== "object") return 0
  const record = value as Record<string, unknown>
  if (typeof record.id === "number") return record.id
  if (typeof record._all === "number") return record._all
  return 0
}

export function normalizeVisitorTrend(visitorTrend: unknown) {
  if (!Array.isArray(visitorTrend)) return []
  return visitorTrend.map((point: unknown) => {
    const row = (point || {}) as { period?: unknown; visitors?: unknown; pageviews?: unknown }
    const period = row.period instanceof Date ? row.period.toISOString() : String(row.period || "")
    return {
      period,
      visitors: toSafeNumber(row.visitors),
      pageviews: toSafeNumber(row.pageviews),
    }
  })
}


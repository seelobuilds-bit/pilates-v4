const DAY_IN_MS = 1000 * 60 * 60 * 24

export type ReportRangeInput = {
  days?: string | null
  startDate?: string | null
  endDate?: string | null
}

export type ResolvedReportRange = {
  days: number
  startDate: Date
  reportEndDate: Date
  previousStartDate: Date
  responseEndDate: Date
}

export type EntityReportDateRange = {
  days: number
  startDate: Date
  endDate: Date
}

export type ReportRangePayload = {
  days: number
  startDate: string
  endDate: string
}

export const DEFAULT_REPORT_PERIOD_DAYS = 30
export const MAX_REPORT_PERIOD_DAYS = 365
export const DEFAULT_MOBILE_ALLOWED_DAY_PRESETS = [7, 30, 90] as const
export const DEFAULT_ENTITY_REPORT_PERIOD_DAYS = 30
export const DEFAULT_ENTITY_ALLOWED_DAY_PRESETS = [7, 30, 90] as const

type ResolveOptions = {
  defaultDays: number
  maxDays?: number
  allowedDays?: number[]
}

export function parseDateInput(value: string | null | undefined) {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function parseReportDays(
  value: string | null | undefined,
  options: { defaultDays: number; maxDays?: number; allowedDays?: number[] }
) {
  if (!value) return options.defaultDays

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return options.defaultDays

  if (Array.isArray(options.allowedDays) && options.allowedDays.length > 0) {
    return options.allowedDays.includes(parsed) ? parsed : options.defaultDays
  }

  const maxDays =
    typeof options.maxDays === 'number' && Number.isFinite(options.maxDays) ? options.maxDays : parsed
  return Math.min(maxDays, Math.max(1, parsed))
}

export function resolveReportRange(input: ReportRangeInput, options: ResolveOptions): ResolvedReportRange {
  const requestedStartDate = parseDateInput(input.startDate || null)
  const requestedEndDate = parseDateInput(input.endDate || null)

  if (
    requestedStartDate &&
    requestedEndDate &&
    requestedStartDate.getTime() <= requestedEndDate.getTime()
  ) {
    const startDate = new Date(requestedStartDate)
    const responseEndDate = new Date(requestedEndDate)
    const reportEndDate = new Date(requestedEndDate)
    reportEndDate.setUTCDate(reportEndDate.getUTCDate() + 1)

    const days = Math.max(1, Math.round((reportEndDate.getTime() - startDate.getTime()) / DAY_IN_MS))
    const previousStartDate = new Date(startDate)
    previousStartDate.setUTCDate(previousStartDate.getUTCDate() - days)

    return {
      days,
      startDate,
      reportEndDate,
      previousStartDate,
      responseEndDate,
    }
  }

  const days = parseReportDays(input.days || null, options)
  const reportEndDate = new Date()
  const responseEndDate = new Date(reportEndDate)
  const startDate = new Date(reportEndDate)
  startDate.setDate(startDate.getDate() - days)
  const previousStartDate = new Date(startDate)
  previousStartDate.setDate(previousStartDate.getDate() - days)

  return {
    days,
    startDate,
    reportEndDate,
    previousStartDate,
    responseEndDate,
  }
}

export function resolveEntityReportDateRange(
  searchParams: URLSearchParams,
  options: { defaultDays: number; allowedDays: number[] }
): EntityReportDateRange {
  const requestedStartDate = parseDateInput(searchParams.get("startDate"))
  const requestedEndDate = parseDateInput(searchParams.get("endDate"))

  if (
    requestedStartDate &&
    requestedEndDate &&
    requestedStartDate.getTime() <= requestedEndDate.getTime()
  ) {
    const startDate = new Date(requestedStartDate)
    const endDate = new Date(requestedEndDate)
    endDate.setUTCHours(23, 59, 59, 999)
    const days =
      Math.max(1, Math.round((requestedEndDate.getTime() - requestedStartDate.getTime()) / DAY_IN_MS) + 1)
    return { days, startDate, endDate }
  }

  const days = parseReportDays(searchParams.get("days"), {
    defaultDays: options.defaultDays,
    allowedDays: options.allowedDays,
  })

  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (days - 1))

  return { days, startDate, endDate }
}

export function resolveDefaultEntityReportDateRange(searchParams: URLSearchParams) {
  return resolveEntityReportDateRange(searchParams, {
    defaultDays: DEFAULT_ENTITY_REPORT_PERIOD_DAYS,
    allowedDays: Array.from(DEFAULT_ENTITY_ALLOWED_DAY_PRESETS),
  })
}

export function resolveDefaultStudioReportRange(input: ReportRangeInput) {
  return resolveReportRange(input, {
    defaultDays: DEFAULT_REPORT_PERIOD_DAYS,
    maxDays: MAX_REPORT_PERIOD_DAYS,
  })
}

export function resolveDefaultMobileReportRange(input: ReportRangeInput) {
  return resolveReportRange(input, {
    defaultDays: DEFAULT_REPORT_PERIOD_DAYS,
    allowedDays: Array.from(DEFAULT_MOBILE_ALLOWED_DAY_PRESETS),
  })
}

export function buildReportRangePayload(days: number, startDate: Date, endDate: Date): ReportRangePayload {
  return {
    days,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

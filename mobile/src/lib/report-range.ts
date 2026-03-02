export type MobileReportRangePreset = "TODAY" | "THIS_MONTH" | "LAST_30" | "CUSTOM"

export const MOBILE_REPORT_RANGE_PRESETS: { id: MobileReportRangePreset; label: string }[] = [
  { id: "TODAY", label: "Today" },
  { id: "THIS_MONTH", label: "This month" },
  { id: "LAST_30", label: "Last 30d" },
  { id: "CUSTOM", label: "Custom" },
]

function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function clampToToday(value: Date) {
  const today = startOfDay(new Date())
  const safeValue = startOfDay(value)
  return safeValue.getTime() > today.getTime() ? today : safeValue
}

function shiftDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

export function formatDateInput(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function defaultCustomRange() {
  const today = startOfDay(new Date())
  return {
    start: shiftDays(today, -29),
    end: today,
  }
}

export function normalizeCustomRange(start: Date, end: Date) {
  const safeStart = startOfDay(start)
  const safeEnd = clampToToday(end)

  if (safeStart.getTime() <= safeEnd.getTime()) {
    return {
      start: safeStart,
      end: safeEnd,
    }
  }

  return {
    start: safeEnd,
    end: safeStart,
  }
}

export function resolveReportRange(
  preset: MobileReportRangePreset,
  customStart: Date,
  customEnd: Date
) {
  const today = startOfDay(new Date())

  if (preset === "TODAY") {
    return {
      preset,
      start: today,
      end: today,
      label: "Today",
    }
  }

  if (preset === "THIS_MONTH") {
    return {
      preset,
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
      label: "This month",
    }
  }

  if (preset === "LAST_30") {
    return {
      preset,
      start: shiftDays(today, -29),
      end: today,
      label: "Last 30 days",
    }
  }

  const normalized = normalizeCustomRange(customStart, customEnd)

  return {
    preset,
    start: normalized.start,
    end: normalized.end,
    label: `${normalized.start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} - ${normalized.end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`,
  }
}

export function buildReportRequestParams(
  preset: MobileReportRangePreset,
  customStart: Date,
  customEnd: Date
) {
  const range = resolveReportRange(preset, customStart, customEnd)

  return {
    startDate: formatDateInput(range.start),
    endDate: formatDateInput(range.end),
  }
}

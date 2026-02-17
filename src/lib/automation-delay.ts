export const DELAY_UNIT_OPTIONS = ["minutes", "hours", "days", "weeks"] as const

export type DelayUnit = (typeof DELAY_UNIT_OPTIONS)[number]

const UNIT_TO_MINUTES: Record<DelayUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 60 * 24,
  weeks: 60 * 24 * 7,
}

export function toDelayMinutes(value: number, unit: DelayUnit) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  return safeValue * UNIT_TO_MINUTES[unit]
}

export function splitDelayMinutes(totalMinutes: number): { value: number; unit: DelayUnit } {
  const safeMinutes = Number.isFinite(totalMinutes) ? Math.max(0, Math.floor(totalMinutes)) : 0

  if (safeMinutes === 0) {
    return { value: 0, unit: "minutes" }
  }

  if (safeMinutes % UNIT_TO_MINUTES.weeks === 0) {
    return { value: safeMinutes / UNIT_TO_MINUTES.weeks, unit: "weeks" }
  }

  if (safeMinutes % UNIT_TO_MINUTES.days === 0) {
    return { value: safeMinutes / UNIT_TO_MINUTES.days, unit: "days" }
  }

  if (safeMinutes % UNIT_TO_MINUTES.hours === 0) {
    return { value: safeMinutes / UNIT_TO_MINUTES.hours, unit: "hours" }
  }

  return { value: safeMinutes, unit: "minutes" }
}

export function formatDelayLabel(value: number, unit: DelayUnit) {
  const normalizedValue = Math.max(0, Math.floor(value))
  if (normalizedValue === 1) {
    if (unit === "minutes") return "1 minute"
    if (unit === "hours") return "1 hour"
    if (unit === "days") return "1 day"
    return "1 week"
  }

  return `${normalizedValue} ${unit}`
}

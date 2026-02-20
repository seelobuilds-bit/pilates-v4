import { LeaderboardTimeframe } from "@prisma/client"

export type PeriodTemplate = {
  startDate: Date
  endDate: Date
  name: string
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
}

function firstDayOfWeekMondayUtc(date: Date) {
  const value = startOfUtcDay(date)
  const day = value.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  return new Date(value.getTime() - diff * 24 * 60 * 60 * 1000)
}

export function buildPeriodTemplate(timeframe: LeaderboardTimeframe, now: Date): PeriodTemplate {
  if (timeframe === "WEEKLY") {
    const startDate = firstDayOfWeekMondayUtc(now)
    const endDate = endOfUtcDay(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000))
    return {
      startDate,
      endDate,
      name: `Week of ${startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })}`,
    }
  }

  if (timeframe === "MONTHLY") {
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    return {
      startDate,
      endDate,
      name: `${now.toLocaleString("default", { month: "long", timeZone: "UTC" })} ${now.getUTCFullYear()}`,
    }
  }

  if (timeframe === "QUARTERLY") {
    const quarter = Math.floor(now.getUTCMonth() / 3)
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3, 1, 0, 0, 0, 0))
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999))
    return {
      startDate,
      endDate,
      name: `Q${quarter + 1} ${now.getUTCFullYear()}`,
    }
  }

  if (timeframe === "YEARLY") {
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))
    return {
      startDate,
      endDate,
      name: `${now.getUTCFullYear()}`,
    }
  }

  // ALL_TIME
  const startDate = new Date(Date.UTC(2020, 0, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(2100, 0, 1, 23, 59, 59, 999))
  return {
    startDate,
    endDate,
    name: "All Time",
  }
}

export function periodMatchesTemplate(
  period: { startDate: Date; endDate: Date },
  template: PeriodTemplate
) {
  return (
    period.startDate.getTime() === template.startDate.getTime() &&
    period.endDate.getTime() === template.endDate.getTime()
  )
}

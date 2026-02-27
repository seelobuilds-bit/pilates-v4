export function toDateOnly(input: Date | string): Date {
  const d = input instanceof Date ? input : new Date(input)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function calculateRequestedDays(
  startDate: Date | string,
  endDate: Date | string,
  isHalfDayStart = false,
  isHalfDayEnd = false
): number {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)

  if (end < start) return 0

  const oneDayMs = 24 * 60 * 60 * 1000
  const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / oneDayMs) + 1

  let total = inclusiveDays
  if (isHalfDayStart) total -= 0.5
  if (isHalfDayEnd) total -= 0.5

  return Math.max(0.5, Number(total.toFixed(2)))
}

export function calculateAnnualLeaveEntitledDays(
  annualLeaveWeeks: number,
  workingDaysPerWeek: number
): number {
  return Number((annualLeaveWeeks * workingDaysPerWeek).toFixed(2))
}

export function calculateDaysWithinYear(
  requestStartDate: Date | string,
  requestEndDate: Date | string,
  year: number,
  isHalfDayStart = false,
  isHalfDayEnd = false
): number {
  const start = toDateOnly(requestStartDate)
  const end = toDateOnly(requestEndDate)
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const yearEnd = new Date(Date.UTC(year, 11, 31))

  const clipStart = start > yearStart ? start : yearStart
  const clipEnd = end < yearEnd ? end : yearEnd

  if (clipEnd < clipStart) return 0

  const oneDayMs = 24 * 60 * 60 * 1000
  const inclusiveDays = Math.floor((clipEnd.getTime() - clipStart.getTime()) / oneDayMs) + 1

  let total = inclusiveDays
  if (isHalfDayStart && clipStart.getTime() === start.getTime()) total -= 0.5
  if (isHalfDayEnd && clipEnd.getTime() === end.getTime()) total -= 0.5

  return Math.max(0, Number(total.toFixed(2)))
}

export function yearsInRange(startDate: Date | string, endDate: Date | string): number[] {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)

  if (end < start) return []

  const years: number[] = []
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year += 1) {
    years.push(year)
  }

  return years
}

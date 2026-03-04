import assert from 'node:assert/strict'
import {
  DEFAULT_MOBILE_ALLOWED_DAY_PRESETS,
  DEFAULT_ENTITY_ALLOWED_DAY_PRESETS,
  DEFAULT_ENTITY_REPORT_PERIOD_DAYS,
  DEFAULT_REPORT_PERIOD_DAYS,
  MAX_REPORT_PERIOD_DAYS,
  parseReportDays,
  resolveDefaultEntityReportDateRange,
  resolveDefaultMobileReportRange,
  resolveDefaultStudioReportRange,
  resolveEntityReportDateRange,
  resolveReportRange,
} from '../../src/lib/reporting/date-range'

function sameUtcDate(actual: Date, expected: string) {
  const iso = actual.toISOString().slice(0, 10)
  assert.equal(iso, expected)
}

function run() {
  assert.equal(parseReportDays(undefined, { defaultDays: 30 }), 30)
  assert.equal(parseReportDays('not-a-number', { defaultDays: 30 }), 30)
  assert.equal(parseReportDays('400', { defaultDays: 30, maxDays: 365 }), 365)
  assert.equal(parseReportDays('0', { defaultDays: 30, maxDays: 365 }), 1)
  assert.equal(parseReportDays('30', { defaultDays: 7, allowedDays: [7, 30, 90] }), 30)
  assert.equal(parseReportDays('365', { defaultDays: 7, allowedDays: [7, 30, 90] }), 7)

  const custom = resolveReportRange(
    { startDate: '2026-03-01', endDate: '2026-03-03' },
    { defaultDays: 30, maxDays: 365 }
  )
  assert.equal(custom.days, 3)
  sameUtcDate(custom.startDate, '2026-03-01')
  sameUtcDate(custom.responseEndDate, '2026-03-03')
  sameUtcDate(custom.reportEndDate, '2026-03-04')
  sameUtcDate(custom.previousStartDate, '2026-02-26')

  const invalidRange = resolveReportRange(
    { startDate: '2026-03-03', endDate: '2026-03-01', days: '90' },
    { defaultDays: 30, allowedDays: [7, 30, 90] }
  )
  assert.equal(invalidRange.days, 90)

  const missingEnd = resolveReportRange(
    { startDate: '2026-03-01', endDate: null, days: '7' },
    { defaultDays: 30, allowedDays: [7, 30, 90] }
  )
  assert.equal(missingEnd.days, 7)

  const entityCustom = resolveEntityReportDateRange(
    new URLSearchParams({ startDate: '2026-03-01', endDate: '2026-03-03' }),
    { defaultDays: 30, allowedDays: [7, 30, 90] }
  )
  assert.equal(entityCustom.days, 3)
  sameUtcDate(entityCustom.startDate, '2026-03-01')
  assert.equal(entityCustom.endDate.toISOString(), '2026-03-03T23:59:59.999Z')

  const entityPreset = resolveEntityReportDateRange(
    new URLSearchParams({ days: '7' }),
    { defaultDays: 30, allowedDays: [7, 30, 90] }
  )
  assert.equal(entityPreset.days, 7)
  assert.equal(entityPreset.startDate.getHours(), 0)
  assert.equal(entityPreset.startDate.getMinutes(), 0)

  const entityDefaultPreset = resolveDefaultEntityReportDateRange(new URLSearchParams())
  assert.equal(entityDefaultPreset.days, DEFAULT_ENTITY_REPORT_PERIOD_DAYS)

  const entityDefaultInvalidDays = resolveDefaultEntityReportDateRange(new URLSearchParams({ days: '365' }))
  assert.equal(entityDefaultInvalidDays.days, DEFAULT_ENTITY_REPORT_PERIOD_DAYS)

  const defaultAllowed = Array.from(DEFAULT_ENTITY_ALLOWED_DAY_PRESETS)
  const entityDefaultAllowed = resolveDefaultEntityReportDateRange(
    new URLSearchParams({ days: String(defaultAllowed[0]) })
  )
  assert.equal(entityDefaultAllowed.days, defaultAllowed[0])

  const studioDefault = resolveDefaultStudioReportRange({})
  assert.equal(studioDefault.days, DEFAULT_REPORT_PERIOD_DAYS)

  const studioMaxBound = resolveDefaultStudioReportRange({ days: '999' })
  assert.equal(studioMaxBound.days, MAX_REPORT_PERIOD_DAYS)

  const mobileDefault = resolveDefaultMobileReportRange({})
  assert.equal(mobileDefault.days, DEFAULT_REPORT_PERIOD_DAYS)

  const mobileAllowed = Array.from(DEFAULT_MOBILE_ALLOWED_DAY_PRESETS)
  const mobileAllowedRange = resolveDefaultMobileReportRange({ days: String(mobileAllowed[0]) })
  assert.equal(mobileAllowedRange.days, mobileAllowed[0])

  const mobileDisallowedRange = resolveDefaultMobileReportRange({ days: '365' })
  assert.equal(mobileDisallowedRange.days, DEFAULT_REPORT_PERIOD_DAYS)

  console.log('PASS reporting date-range logic')
}

run()

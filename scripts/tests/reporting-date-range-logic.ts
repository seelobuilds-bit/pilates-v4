import assert from 'node:assert/strict'
import { parseReportDays, resolveReportRange } from '../../src/lib/reporting/date-range'

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

  console.log('PASS reporting date-range logic')
}

run()

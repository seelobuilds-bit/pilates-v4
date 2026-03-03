import assert from 'node:assert/strict'
import { resolveBookingRevenue } from '../../src/lib/reporting/revenue'

function run() {
  assert.equal(resolveBookingRevenue(25, 40), 25)
  assert.equal(resolveBookingRevenue(null, 40), 40)
  assert.equal(resolveBookingRevenue(undefined, 40), 40)
  assert.equal(resolveBookingRevenue(undefined, null), 0)
  assert.equal(resolveBookingRevenue(0, 40), 0)
  console.log('PASS reporting revenue logic')
}

run()

import assert from 'node:assert/strict'
import {
  ATTENDED_BOOKING_STATUSES,
  calculateAverageClassSize,
  calculateAverageFillRate,
  countAttendedBookings,
  isAttendedBookingStatus,
} from '../../src/lib/reporting/attendance'

function run() {
  assert.equal(ATTENDED_BOOKING_STATUSES.has('CONFIRMED'), true)
  assert.equal(ATTENDED_BOOKING_STATUSES.has('COMPLETED'), true)
  assert.equal(ATTENDED_BOOKING_STATUSES.has('NO_SHOW'), true)
  assert.equal(ATTENDED_BOOKING_STATUSES.has('CANCELLED'), false)

  assert.equal(isAttendedBookingStatus('CONFIRMED'), true)
  assert.equal(isAttendedBookingStatus('CANCELLED'), false)

  assert.equal(countAttendedBookings([{ status: 'CONFIRMED' }, { status: 'CANCELLED' }, { status: 'NO_SHOW' }]), 2)
  assert.equal(calculateAverageClassSize(10, 4), 2.5)
  assert.equal(calculateAverageClassSize(0, 0), 0)

  const fill = calculateAverageFillRate(
    [
      { capacity: 10, bookings: [{ status: 'CONFIRMED' }, { status: 'COMPLETED' }, { status: 'CANCELLED' }] },
      { capacity: 8, bookings: [{ status: 'NO_SHOW' }, { status: 'CONFIRMED' }] },
    ],
    0
  )

  assert.equal(fill, 23)
  assert.equal(calculateAverageFillRate([], 0), 0)
  console.log('PASS reporting attendance logic')
}

run()

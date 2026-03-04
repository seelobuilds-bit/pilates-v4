import assert from "node:assert/strict"
import {
  addCountToMonthlyBuckets,
  addRevenueToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBuckets,
  buildMonthlyRevenueBuckets,
} from "../../src/lib/reporting/monthly"

const referenceDate = new Date("2026-03-15T12:00:00.000Z")

const countBuckets = buildMonthlyCountBuckets(referenceDate, 6)
assert.equal(countBuckets.length, 6)
assert.deepEqual(
  countBuckets.map((bucket) => bucket.month),
  ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
)

const countLookup = buildMonthlyBucketLookup(countBuckets)
addCountToMonthlyBuckets(countLookup, new Date("2026-03-02T09:00:00.000Z"))
addCountToMonthlyBuckets(countLookup, new Date("2026-03-20T09:00:00.000Z"), 2)
addCountToMonthlyBuckets(countLookup, new Date("2026-02-01T09:00:00.000Z"))
addCountToMonthlyBuckets(countLookup, new Date("2025-01-01T09:00:00.000Z")) // outside range

assert.equal(countBuckets[4].count, 1)
assert.equal(countBuckets[5].count, 3)
assert.equal(countBuckets.reduce((sum, bucket) => sum + bucket.count, 0), 4)

const revenueBuckets = buildMonthlyRevenueBuckets(referenceDate, 6)
assert.equal(revenueBuckets.length, 6)
assert.deepEqual(
  revenueBuckets.map((bucket) => bucket.month),
  ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
)

const revenueLookup = buildMonthlyBucketLookup(revenueBuckets)
addRevenueToMonthlyBuckets(revenueLookup, new Date("2026-03-05T09:00:00.000Z"), 10.5)
addRevenueToMonthlyBuckets(revenueLookup, new Date("2026-03-10T09:00:00.000Z"), 24.25)
addRevenueToMonthlyBuckets(revenueLookup, new Date("2026-02-10T09:00:00.000Z"), 12)
addRevenueToMonthlyBuckets(revenueLookup, new Date("2024-08-10T09:00:00.000Z"), 999) // outside range

assert.equal(revenueBuckets[4].revenue, 12)
assert.equal(revenueBuckets[5].revenue, 34.75)
assert.equal(
  Math.round(revenueBuckets.reduce((sum, bucket) => sum + bucket.revenue, 0) * 100) / 100,
  46.75
)

console.log("Reporting monthly bucket logic passed")

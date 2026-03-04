import assert from "node:assert/strict"
import { bucketIndexForDate, buildTrendBuckets } from "../../src/lib/reporting/trend-series"

const start = new Date("2026-03-01T00:00:00.000Z")
const end = new Date("2026-03-05T00:00:00.000Z")
const buckets = buildTrendBuckets(start, end, 4)

assert.equal(buckets.length, 4)
assert.equal(buckets[0].start.toISOString(), "2026-03-01T00:00:00.000Z")
assert.equal(buckets[3].end.toISOString(), "2026-03-05T00:00:00.000Z")

assert.equal(bucketIndexForDate(new Date("2026-03-01T12:00:00.000Z"), buckets), 0)
assert.equal(bucketIndexForDate(new Date("2026-03-02T12:00:00.000Z"), buckets), 1)
assert.equal(bucketIndexForDate(new Date("2026-03-04T23:59:59.000Z"), buckets), 3)
assert.equal(bucketIndexForDate(new Date("2026-03-05T00:00:00.000Z"), buckets), -1)

console.log("Reporting trend series logic passed")

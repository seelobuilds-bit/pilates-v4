import assert from "node:assert/strict"
import { buildMobileMetric, calcMobileMetricChange } from "../../src/lib/reporting/mobile-report-metrics"

assert.equal(calcMobileMetricChange(0, 0), 0)
assert.equal(calcMobileMetricChange(25, 0), 100)
assert.equal(calcMobileMetricChange(15, 10), 50)
assert.equal(calcMobileMetricChange(7.5, 10), -25)

const metric = buildMobileMetric("revenue", "Revenue", "currency", 25, 10)

assert.deepEqual(metric, {
  id: "revenue",
  label: "Revenue",
  value: 25,
  previousValue: 10,
  changePct: 150,
  format: "currency",
})

console.log("Reporting mobile metrics logic passed")

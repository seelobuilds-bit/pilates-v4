import { strict as assert } from "assert"
import {
  buildClientVisitCounts,
  calculateChurnRate,
  calculateRepeatClientRetentionRate,
  countRepeatClients,
  getClientRiskStatus,
} from "../../src/lib/reporting/retention"

const singleVisitCounts = new Map([
  ["a", 1],
  ["b", 1],
  ["c", 1],
])

const mixedVisitCounts = new Map([
  ["a", 3],
  ["b", 1],
  ["c", 2],
  ["d", 1],
])

assert.equal(countRepeatClients(singleVisitCounts), 0)
assert.equal(countRepeatClients(mixedVisitCounts), 2)
assert.equal(calculateRepeatClientRetentionRate(singleVisitCounts, 1), 0)
assert.equal(calculateRepeatClientRetentionRate(mixedVisitCounts, 1), 50)

assert.equal(calculateChurnRate(0, 10, 1), 0)
assert.equal(calculateChurnRate(3, 12, 1), 25)

const builtVisitCounts = buildClientVisitCounts(
  [
    { clientId: "a" },
    { clientId: "a" },
    { clientId: "b" },
    { clientId: null },
  ],
  (row) => row.clientId
)
assert.deepEqual(Array.from(builtVisitCounts.entries()), [
  ["a", 2],
  ["b", 1],
])

const reportEndDate = new Date("2026-03-03T00:00:00.000Z")

assert.deepEqual(getClientRiskStatus(new Date("2026-02-25T00:00:00.000Z"), reportEndDate), {
  isAtRisk: false,
  status: "medium-risk",
})

assert.deepEqual(getClientRiskStatus(new Date("2026-02-10T00:00:00.000Z"), reportEndDate), {
  isAtRisk: true,
  status: "medium-risk",
})

assert.deepEqual(getClientRiskStatus(new Date("2026-01-20T00:00:00.000Z"), reportEndDate), {
  isAtRisk: true,
  status: "high-risk",
})

assert.deepEqual(getClientRiskStatus(null, reportEndDate), {
  isAtRisk: true,
  status: "high-risk",
})

console.log("Retention/churn reporting logic passed")

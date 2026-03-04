import assert from "node:assert/strict"
import { buildPartialReportsPayload } from "../../src/lib/reporting/fallback"

const startDate = new Date("2026-03-01T00:00:00.000Z")
const endDate = new Date("2026-03-04T00:00:00.000Z")

const withoutChurnMeta = buildPartialReportsPayload({
  totalClients: 100,
  newClients: 12,
  activeClients: 80,
  churnedClients: 20,
  days: 30,
  startDate,
  endDate,
  warningMessage: "Partial reports payload returned due to data timeout. Retry shortly.",
})

assert.equal(withoutChurnMeta.partial, true)
assert.equal(withoutChurnMeta.clients.total, 100)
assert.equal(withoutChurnMeta.clients.new, 12)
assert.equal(withoutChurnMeta.retention.atRiskClients, 0)
assert.equal("churnRate" in withoutChurnMeta.retention, false)
assert.equal(withoutChurnMeta.marketing.insights[0]?.type, "warning")
assert.equal(
  withoutChurnMeta.marketing.insights[0]?.message,
  "Partial reports payload returned due to data timeout. Retry shortly."
)

const withChurnMeta = buildPartialReportsPayload({
  totalClients: 0,
  newClients: 0,
  activeClients: 0,
  churnedClients: 0,
  days: 7,
  startDate,
  endDate,
  warningMessage: "Reports are temporarily degraded. Retry in a moment.",
  includeChurnMeta: true,
})

assert.equal(withChurnMeta.partial, true)
assert.equal(withChurnMeta.clients.total, 0)
assert.equal("churnRate" in withChurnMeta.retention, true)
assert.equal("churnDefinition" in withChurnMeta.retention, true)
if (!("churnRate" in withChurnMeta.retention) || !("churnDefinition" in withChurnMeta.retention)) {
  throw new Error("Expected churn metadata in fallback retention summary")
}
assert.equal(withChurnMeta.retention.churnRate, 0)
assert.equal(withChurnMeta.retention.churnDefinition, "inactive clients / total clients")
assert.equal(withChurnMeta.range.days, 7)
assert.equal(withChurnMeta.range.startDate, startDate.toISOString())
assert.equal(withChurnMeta.range.endDate, endDate.toISOString())

console.log("Reporting fallback payload logic passed")

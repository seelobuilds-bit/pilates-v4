import assert from "node:assert/strict"
import { buildChurnMeta, buildEmptyChurnMeta, REPORTING_CHURN_DEFINITION } from "../../src/lib/reporting/retention-churn"

const meta = buildChurnMeta(3, 12, 1)
assert.equal(meta.churnRate, 25)
assert.equal(meta.churnDefinition, REPORTING_CHURN_DEFINITION)

const emptyMeta = buildEmptyChurnMeta()
assert.equal(emptyMeta.churnRate, 0)
assert.equal(emptyMeta.churnDefinition, REPORTING_CHURN_DEFINITION)

console.log("Reporting retention churn logic passed")

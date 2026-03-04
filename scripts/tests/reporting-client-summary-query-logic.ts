import assert from "node:assert/strict"
import { mapClientSummaryCountResults } from "../../src/lib/reporting/client-summary-counts"

const mapped = mapClientSummaryCountResults({
  totalClients: 42,
  activeClients: 31,
  churnedClients: 11,
  newClients: 8,
})

assert.deepEqual(mapped, {
  totalClients: 42,
  activeClients: 31,
  churnedClients: 11,
  newClients: 8,
})

console.log("Reporting client summary query logic passed")

import assert from "node:assert/strict"
import { buildStudioReportPayload } from "../../src/lib/reporting/studio-report-payload"

const payload = buildStudioReportPayload({
  days: 30,
  startDate: new Date("2026-02-01T00:00:00.000Z"),
  reportEndDate: new Date("2026-03-01T00:00:00.000Z"),
  revenue: { total: 1200 },
  clients: { total: 40 },
  instructors: [{ id: "t1" }],
  retention: { atRiskClients: 2 },
  classes: { total: 22 },
  bookings: { total: 110 },
  marketing: { emailsSent: 30 },
  social: { activeFlows: 4 },
})

assert.equal((payload.revenue as { total: number }).total, 1200)
assert.equal((payload.clients as { total: number }).total, 40)
assert.equal((payload.range as { days: number }).days, 30)
assert.equal((payload.range as { startDate: string }).startDate, "2026-02-01T00:00:00.000Z")
assert.equal((payload.range as { endDate: string }).endDate, "2026-03-01T00:00:00.000Z")

console.log("Reporting studio report payload logic passed")

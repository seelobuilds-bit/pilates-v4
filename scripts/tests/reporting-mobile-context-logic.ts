import assert from "node:assert/strict"
import { buildMobileReportContext } from "../../src/lib/reporting/mobile-report-context"

const context = buildMobileReportContext(
  {
    ok: true,
    token: "token",
    decoded: { role: "OWNER", sub: "user_1" },
    studio: {
      id: "studio_1",
      name: "Test Studio",
      subdomain: "test",
      primaryColor: "#000",
      currency: "EUR",
    } as never,
  } as never,
  { days: "30", startDate: null, endDate: null }
)

assert.equal(context.decoded.role, "OWNER")
assert.equal(context.studioSummary.subdomain, "test")
assert.equal(context.periodDays, 30)

console.log("Reporting mobile context logic passed")

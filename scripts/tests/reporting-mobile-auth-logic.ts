import assert from "node:assert/strict"
import { assertMobileReportsAuth } from "../../src/lib/reporting/mobile-report-auth"

assert.doesNotThrow(() =>
  assertMobileReportsAuth({
    ok: true,
    token: "token",
    decoded: { role: "OWNER", sub: "user_1" },
    studio: {
      id: "studio_1",
      name: "Test Studio",
      subdomain: "test",
      primaryColor: null,
      currency: "EUR",
    } as never,
  } as never)
)

assert.throws(
  () =>
    assertMobileReportsAuth({
      ok: false,
      reason: "missing_token",
    } as never),
  /Missing bearer token/
)

assert.throws(
  () =>
    assertMobileReportsAuth({
      ok: false,
      reason: "invalid_token",
    } as never),
  /Invalid token/
)

assert.throws(
  () =>
    assertMobileReportsAuth({
      ok: false,
      reason: "studio_not_found",
    } as never),
  /Studio not found/
)

console.log("Reporting mobile auth logic passed")

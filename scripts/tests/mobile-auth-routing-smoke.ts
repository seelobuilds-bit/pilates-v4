import { isAllowedAppRoute, parseRequestedAppRoute, resolvePostLoginRoute } from "../../mobile/src/lib/auth-routing"

let passed = 0
let failed = 0

function assertEqual(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`PASS ${name} -> ${String(actual)}`)
    passed += 1
    return
  }

  console.log(`FAIL ${name} expected ${String(expected)} but got ${String(actual)}`)
  failed += 1
}

console.log("\n=== Mobile Auth Routing Smoke ===")

assertEqual("allowlist accepts inbox", isAllowedAppRoute("/(app)/inbox"), true)
assertEqual("allowlist rejects unknown route", isAllowedAppRoute("/(app)/unknown"), false)
assertEqual("parse default section", parseRequestedAppRoute(["(app)", "index"]), "/(app)")
assertEqual("parse valid section", parseRequestedAppRoute(["(app)", "reports"]), "/(app)/reports")
assertEqual("parse invalid section", parseRequestedAppRoute(["(app)", "bad"]), "/(app)")

assertEqual(
  "resolve prefers push route",
  resolvePostLoginRoute({ pendingPushRoute: "/(app)/inbox", postLoginRoute: "/(app)/reports" }),
  "/(app)/inbox"
)
assertEqual(
  "resolve falls back to post-login route",
  resolvePostLoginRoute({ pendingPushRoute: null, postLoginRoute: "/(app)/reports" }),
  "/(app)/reports"
)
assertEqual("resolve defaults home", resolvePostLoginRoute({ pendingPushRoute: null, postLoginRoute: null }), "/(app)")

console.log("\n--- Mobile Auth Routing Summary ---")
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failed > 0) {
  process.exitCode = 1
}

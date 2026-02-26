import { routeFromPushPayload } from "../../mobile/src/lib/push-routing"

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

console.log("\n=== Mobile Push Routing Smoke ===")

assertEqual("inbox message route", routeFromPushPayload({ type: "mobile_inbox_message" }), "/(app)/inbox")
assertEqual("booking created route", routeFromPushPayload({ type: "mobile_booking_created" }), "/(app)/schedule")
assertEqual("booking reactivated route", routeFromPushPayload({ type: "mobile_booking_reactivated" }), "/(app)/schedule")
assertEqual("booking cancelled route", routeFromPushPayload({ type: "mobile_booking_cancelled" }), "/(app)/schedule")
assertEqual("push test route", routeFromPushPayload({ type: "mobile_push_test" }), "/(app)/profile")
assertEqual("unknown type route", routeFromPushPayload({ type: "other" }), null)
assertEqual("empty payload route", routeFromPushPayload(null), null)

console.log("\n--- Mobile Push Routing Summary ---")
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failed > 0) {
  process.exitCode = 1
}

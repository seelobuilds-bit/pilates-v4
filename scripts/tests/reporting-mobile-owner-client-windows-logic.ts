import assert from "node:assert/strict"
import { splitMobileOwnerClientWindows } from "../../src/lib/reporting/mobile-owner-client-windows"

const result = splitMobileOwnerClientWindows({
  studioClients: [
    { createdAt: new Date("2026-02-05T00:00:00.000Z") },
    { createdAt: new Date("2026-02-20T00:00:00.000Z") },
    { createdAt: new Date("2026-03-03T00:00:00.000Z") },
  ],
  currentStart: new Date("2026-03-01T00:00:00.000Z"),
  previousStart: new Date("2026-02-01T00:00:00.000Z"),
  periodEnd: new Date("2026-03-05T00:00:00.000Z"),
})

assert.equal(result.currentRows.length, 1)
assert.equal(result.previousCount, 2)

console.log("Reporting mobile owner client windows logic passed")

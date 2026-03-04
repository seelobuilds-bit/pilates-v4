import assert from "node:assert/strict"
import { buildMobileClientHighlights } from "../../src/lib/reporting/mobile-client-report-highlights"

assert.deepEqual(buildMobileClientHighlights(null), [
  { label: "Next class", value: "No upcoming bookings yet" },
])

const highlights = buildMobileClientHighlights({
  classSession: {
    startTime: "2026-03-08T10:30:00.000Z",
    classType: { name: "Athletic Core" },
  },
})

assert.equal(highlights[0].label, "Next class")
assert.match(highlights[0].value, /^Athletic Core · /)

console.log("Reporting mobile client highlights logic passed")

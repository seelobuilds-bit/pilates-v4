import assert from "node:assert/strict"
import { buildClassTypeHighlights } from "../../src/lib/reporting/mobile-report-highlights"

const highlights = buildClassTypeHighlights([
  {
    classType: { name: "Reformer" },
    capacity: 10,
    bookings: [{ status: "COMPLETED" }, { status: "CONFIRMED" }, { status: "CANCELLED" }],
  },
  {
    classType: { name: "Reformer" },
    capacity: 8,
    bookings: [{ status: "COMPLETED" }, { status: "NO_SHOW" }],
  },
  {
    classType: { name: "Mat" },
    capacity: 12,
    bookings: [{ status: "COMPLETED" }],
  },
])

assert.deepEqual(highlights, [
  { label: "Reformer", value: "2 classes · 22% fill" },
  { label: "Mat", value: "1 classes · 8% fill" },
])

console.log("Reporting mobile highlights logic passed")

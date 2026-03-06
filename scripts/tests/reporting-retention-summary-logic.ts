import assert from "node:assert/strict"
import { buildRetentionSummary } from "../../src/lib/reporting/retention-summary"

const summary = buildRetentionSummary({
  atRiskCandidates: [
    {
      id: "c1",
      lastVisit: new Date("2026-02-01T00:00:00.000Z"),
      visits: 4,
      status: "high-risk",
    },
    {
      id: "c2",
      lastVisit: null,
      visits: 0,
      status: "high-risk",
    },
  ],
  atRiskClientDetails: [
    { id: "c1", firstName: "Alice", lastName: "Example", email: "alice@example.com" },
    { id: "c2", firstName: "Bria", lastName: "Example", email: "bria@example.com" },
  ],
  activeClientsList: [
    {
      id: "c1",
      createdAt: new Date("2026-02-15T00:00:00.000Z"),
      credits: 0,
    },
    {
      id: "c2",
      createdAt: new Date("2025-12-01T00:00:00.000Z"),
      credits: 6,
    },
    {
      id: "c3",
      createdAt: new Date("2025-06-01T00:00:00.000Z"),
      credits: 12,
    },
  ],
  recentlyActiveClientIds: new Set(["c1", "c3"]),
  cancelledBookingsInPeriod: [
    { cancellationReason: "Sick" },
    { cancellationReason: "Sick" },
    { cancellationReason: " " },
  ],
  reportEndDate: new Date("2026-03-15T00:00:00.000Z"),
  churnedClients: 2,
  totalClients: 8,
})

assert.equal(summary.atRiskClients, 2)
assert.equal(summary.atRiskList.length, 2)
assert.equal(summary.atRiskList[0].lastVisit, "Feb 1, 2026")
assert.equal(summary.atRiskList[1].lastVisit, "Never")
assert.deepEqual(summary.membershipBreakdown, [
  { type: "No credits", count: 1, percent: 33.3 },
  { type: "1-4 credits", count: 0, percent: 0 },
  { type: "5-9 credits", count: 1, percent: 33.3 },
  { type: "10+ credits", count: 1, percent: 33.3 },
])
assert.deepEqual(summary.churnReasons, [
  { reason: "Sick", count: 2 },
  { reason: "No reason provided", count: 1 },
])
assert.deepEqual(summary.cohortRetention, [
  { cohort: "0-30 days", retained: 100 },
  { cohort: "31-90 days", retained: 0 },
  { cohort: "91-180 days", retained: 0 },
  { cohort: "181+ days", retained: 100 },
])
assert.equal(summary.churnRate, 25)
assert.equal(summary.churnDefinition, "inactive clients / total clients")

console.log("Reporting retention summary logic passed")

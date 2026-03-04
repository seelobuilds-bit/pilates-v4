import {
  buildActiveClientVisitIndex,
  buildAtRiskCandidates,
  buildClientSummary,
} from "../../src/lib/reporting/retention"

const reportEndDate = new Date("2026-03-04T00:00:00.000Z")

const visitRows = [
  {
    clientId: "a",
    classSession: { startTime: new Date("2026-03-03T09:00:00.000Z") },
  },
  {
    clientId: "a",
    classSession: { startTime: new Date("2026-02-25T09:00:00.000Z") },
  },
  {
    clientId: "b",
    classSession: { startTime: new Date("2026-02-15T09:00:00.000Z") },
  },
] satisfies Array<{ clientId: string; classSession: { startTime: Date } }>

const { visitCountByClientId, lastVisitByClientId, recentlyActiveClientIds } =
  buildActiveClientVisitIndex(visitRows, reportEndDate)

if (visitCountByClientId.get("a") !== 2 || visitCountByClientId.get("b") !== 1) {
  throw new Error("Visit counts were not indexed correctly")
}

if (lastVisitByClientId.get("a")?.toISOString() !== "2026-03-03T09:00:00.000Z") {
  throw new Error("Most recent visit should be preserved for client a")
}

if (!recentlyActiveClientIds.has("a") || !recentlyActiveClientIds.has("b")) {
  throw new Error("Recent activity index is incorrect")
}

const clients = [
  { id: "a", firstName: "Amelia", lastName: "Wilson", email: "a@test.com", isActive: true },
  { id: "b", firstName: "Bianca", lastName: "Stone", email: "b@test.com", isActive: true },
  { id: "c", firstName: "Cara", lastName: "Nash", email: "c@test.com", isActive: true },
  { id: "d", firstName: "Dana", lastName: "Lake", email: "d@test.com", isActive: false },
]

const atRisk = buildAtRiskCandidates(clients, lastVisitByClientId, visitCountByClientId, reportEndDate)

if (atRisk.length !== 2) {
  throw new Error(`Expected 2 at-risk clients, received ${atRisk.length}`)
}

if (atRisk[0]?.id !== "c" || atRisk[0]?.status !== "high-risk") {
  throw new Error("Never-visited active clients should sort first and be high-risk")
}

const mediumRisk = atRisk.find((client) => client.id === "b")
if (!mediumRisk || mediumRisk.status !== "medium-risk") {
  throw new Error("Client b should be medium-risk based on recency")
}

const summary = buildClientSummary(20, 3, 16, 4)
if (summary.total !== 20 || summary.new !== 3 || summary.active !== 16 || summary.churned !== 4) {
  throw new Error("Client summary helper returned incorrect values")
}

console.log("Reporting client activity logic passed")

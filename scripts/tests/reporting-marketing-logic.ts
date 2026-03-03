import assert from "node:assert/strict"
import { buildCampaignRows, buildMarketingInsights } from "../../src/lib/reporting/marketing"

const positiveInsights = buildMarketingInsights({
  emailsSent: 10,
  emailOpenRate: 55.5,
  previousEmailOpenRate: 50,
  bookingsFromEmail: 3,
  noShowRate: 4,
  previousNoShowRate: 6,
})

assert.equal(positiveInsights.length, 3)
assert.equal(positiveInsights[0].type, "positive")
assert.match(positiveInsights[0].message, /55\.5%/)
assert.equal(positiveInsights[1].type, "positive")
assert.equal(positiveInsights[2].type, "positive")

const emptyInsights = buildMarketingInsights({
  emailsSent: 0,
  emailOpenRate: 0,
  previousEmailOpenRate: 0,
  bookingsFromEmail: 0,
  noShowRate: 0,
  previousNoShowRate: 0,
})

assert.equal(emptyInsights.length, 2)
assert.equal(emptyInsights[0].type, "info")

const campaignRows = buildCampaignRows({
  campaignBuckets: new Map([
    [
      "c2",
      {
        sent: 4,
        opened: 3,
        clicked: 1,
        clients: new Set(["a", "b"]),
      },
    ],
    [
      "c1",
      {
        sent: 4,
        opened: 2,
        clicked: 1,
        clients: new Set(["a", "c"]),
      },
    ],
    [
      "missing",
      {
        sent: 1,
        opened: 0,
        clicked: 0,
        clients: new Set(["z"]),
      },
    ],
  ]),
  campaignNameById: new Map([
    ["c1", "Alpha"],
    ["c2", "Bravo"],
  ]),
  bookingsByClientId: new Map([
    ["a", 2],
    ["b", 1],
  ]),
})

assert.equal(campaignRows.length, 3)
assert.equal(campaignRows[0].id, "c1")
assert.equal(campaignRows[1].id, "c2")
assert.equal(campaignRows[2].name, "Campaign")
assert.equal(campaignRows[0].bookings, 1)
assert.equal(campaignRows[1].bookings, 2)
assert.equal(campaignRows[2].bookings, 0)

console.log("Reporting marketing logic passed")

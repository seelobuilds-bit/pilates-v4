import assert from "node:assert/strict"
import {
  summarizeClassFlowAdminOverview,
  summarizeClassFlowCatalog,
  summarizeClassFlowDetail,
} from "../../src/lib/class-flows/analytics"

function run() {
  const catalog = summarizeClassFlowCatalog(
    [
      { contentCount: 4, featuredContentCount: 1 },
      { contentCount: 3, featuredContentCount: 2 },
    ],
    [{ isCompleted: true }, { isCompleted: false }, { isCompleted: true }],
    [{ status: "PENDING" }, { status: "APPROVED" }, { status: "SCHEDULED" }, { status: "COMPLETED" }]
  )

  assert.deepEqual(catalog, {
    categories: 2,
    totalContent: 7,
    featuredContent: 3,
    completedContent: 2,
    pendingTrainingRequests: 3,
  })

  const admin = summarizeClassFlowAdminOverview(
    [{ viewCount: 5 }, { viewCount: 8 }, { viewCount: 0 }],
    6,
    [{ status: "PENDING" }, { status: "APPROVED" }, { status: "PENDING" }]
  )

  assert.deepEqual(admin, {
    totalViews: 13,
    completedCount: 6,
    pendingTrainingRequests: 2,
  })

  const detail = summarizeClassFlowDetail([{ status: "PENDING" }, { status: "SCHEDULED" }], 5, 9)

  assert.deepEqual(detail, {
    categoryContentCount: 9,
    relatedContentCount: 5,
    requestCount: 2,
  })

  console.log("Class flow analytics logic passed")
}

run()

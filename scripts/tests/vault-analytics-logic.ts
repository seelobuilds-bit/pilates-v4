import assert from "node:assert/strict"
import {
  summarizeVaultCourseEnrollments,
  summarizeVaultCourses,
  summarizeVaultEnrollments,
} from "../../src/lib/vault/analytics"

function run() {
  const courseStats = summarizeVaultCourses([
    { isPublished: true, isFeatured: true, enrollmentCount: 12 },
    { isPublished: false, isFeatured: false, enrollmentCount: 5 },
    { isPublished: true, isFeatured: false, enrollmentCount: null },
  ])

  assert.deepEqual(courseStats, {
    totalCourses: 3,
    publishedCourses: 2,
    featuredCourses: 1,
    totalEnrollments: 17,
  })

  const enrollmentStats = summarizeVaultEnrollments([
    { status: "ACTIVE", paidAmount: 49.995 },
    { status: "COMPLETED", paidAmount: 20 },
    { status: "CANCELLED", paidAmount: null },
  ])

  assert.deepEqual(enrollmentStats, {
    total: 3,
    active: 1,
    completed: 1,
    totalRevenue: 70,
  })

  const courseEnrollmentStats = summarizeVaultCourseEnrollments([
    { status: "ACTIVE", paidAmount: 20, progressPercent: 30 },
    { status: "COMPLETED", paidAmount: 20, progressPercent: 100 },
    { status: "COMPLETED", paidAmount: 20, progressPercent: null },
  ])

  assert.deepEqual(courseEnrollmentStats, {
    totalEnrollments: 3,
    activeEnrollments: 1,
    completedEnrollments: 2,
    completionRate: 66.7,
    averageProgress: 43.3,
  })

  console.log("Vault analytics logic passed")
}

run()

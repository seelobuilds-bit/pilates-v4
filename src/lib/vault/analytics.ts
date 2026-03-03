import { ratioPercentage, roundCurrency, roundTo } from "../reporting/metrics"

type CourseSummaryInput = {
  isPublished: boolean
  isFeatured: boolean
  enrollmentCount: number | null
}

type EnrollmentSummaryInput = {
  status: string
  paidAmount: number | null
  progressPercent?: number | null
}

export function summarizeVaultCourses(courses: CourseSummaryInput[]) {
  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((course) => course.isPublished).length,
    featuredCourses: courses.filter((course) => course.isFeatured).length,
    totalEnrollments: courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0),
  }
}

export function summarizeVaultEnrollments(enrollments: EnrollmentSummaryInput[]) {
  const total = enrollments.length
  const active = enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length
  const completed = enrollments.filter((enrollment) => enrollment.status === "COMPLETED").length
  const totalRevenue = roundCurrency(
    enrollments.reduce((sum, enrollment) => sum + (enrollment.paidAmount || 0), 0)
  )

  return {
    total,
    active,
    completed,
    totalRevenue,
  }
}

export function summarizeVaultCourseEnrollments(enrollments: EnrollmentSummaryInput[]) {
  const { total, active, completed } = summarizeVaultEnrollments(enrollments)
  const averageProgress =
    total > 0
      ? roundTo(
          enrollments.reduce((sum, enrollment) => sum + (enrollment.progressPercent || 0), 0) / total,
          1
        )
      : 0

  return {
    totalEnrollments: total,
    activeEnrollments: active,
    completedEnrollments: completed,
    completionRate: ratioPercentage(completed, total, 1),
    averageProgress,
  }
}

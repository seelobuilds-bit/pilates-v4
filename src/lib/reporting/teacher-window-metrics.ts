import { buildTeacherPerformanceSummary } from "./teacher-performance"

type TeacherBookingLike = {
  status: string
  clientId: string
  paidAmount: number | null
  classSession: {
    classType: {
      price: number
    }
  }
}

type TeacherSessionLike = {
  capacity: number
  classType?: {
    name: string
  } | null
  bookings: Array<{
    status: string
  }>
}

export function buildTeacherWindowMetrics(args: {
  currentSessions: TeacherSessionLike[]
  previousSessions: TeacherSessionLike[]
  currentBookings: TeacherBookingLike[]
  previousBookings: TeacherBookingLike[]
  decimals?: number
}) {
  const {
    currentSessions,
    previousSessions,
    currentBookings,
    previousBookings,
    decimals = 1,
  } = args

  const currentPerformance = buildTeacherPerformanceSummary(currentSessions, currentBookings, decimals)
  const previousPerformance = buildTeacherPerformanceSummary(previousSessions, previousBookings, decimals)

  return {
    currentRevenue: currentPerformance.revenue,
    previousRevenue: previousPerformance.revenue,
    currentClasses: currentPerformance.totalClasses,
    previousClasses: previousPerformance.totalClasses,
    currentStudents: currentPerformance.totalStudents,
    previousStudents: previousPerformance.totalStudents,
    currentFillRate: currentPerformance.avgFillRate,
    previousFillRate: previousPerformance.avgFillRate,
    currentCompletionRate: currentPerformance.completionRate,
    previousCompletionRate: previousPerformance.completionRate,
  }
}

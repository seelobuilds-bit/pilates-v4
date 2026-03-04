import { fetchTeacherPerformanceWindow } from "./teacher-performance-query"

export async function loadMobileTeacherReportData(args: {
  studioId: string
  teacherId: string
  currentStart: Date
  previousStart: Date
  periodEnd: Date
}) {
  const { studioId, teacherId, currentStart, previousStart, periodEnd } = args

  const [currentWindow, previousWindow] = await Promise.all([
    fetchTeacherPerformanceWindow({
      studioId,
      teacherId,
      startDate: currentStart,
      endDate: periodEnd,
    }),
    fetchTeacherPerformanceWindow({
      studioId,
      teacherId,
      startDate: previousStart,
      endDate: currentStart,
    }),
  ])

  return {
    currentWindow,
    previousWindow,
  }
}

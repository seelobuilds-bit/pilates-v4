import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildTeacherPerformanceSummary } from "@/lib/reporting/teacher-performance"
import { fetchTeacherPerformanceWindow } from "@/lib/reporting/teacher-performance-query"
import {
  addCountToMonthlyBuckets,
  buildMonthlyBucketLookup,
  buildMonthlyCountBuckets,
} from "@/lib/reporting/monthly"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.teacherId || !session.user.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teacherId = session.user.teacherId
    const studioId = session.user.studioId

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sixMonthWindowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [studio, upcomingClassesRaw, recentClasses, monthPerformance, sixMonthClasses] = await Promise.all([
      db.studio.findUnique({
        where: { id: studioId },
        select: {
          stripeCurrency: true,
        },
      }),
      db.classSession.findMany({
        where: {
          teacherId,
          studioId,
          startTime: {
            gte: now,
            lt: tomorrow
          }
        },
        include: {
          classType: true,
          location: true,
          bookings: {
            where: {
              status: "CONFIRMED"
            },
            select: {
              client: {
                select: {
                  healthIssues: true,
                  classNotes: true
                }
              }
            }
          },
          _count: { select: { bookings: true } }
        },
        orderBy: { startTime: "asc" }
      }),
      db.classSession.findMany({
        where: {
          teacherId,
          studioId,
          startTime: {
            gte: startOfMonth,
            lt: now
          }
        },
        include: {
          classType: true,
          location: true,
          _count: { select: { bookings: true } }
        },
        orderBy: { startTime: "desc" },
        take: 5
      }),
      fetchTeacherPerformanceWindow({
        studioId,
        teacherId,
        startDate: startOfMonth,
        endDate: now,
      }),
      db.classSession.findMany({
        where: {
          teacherId,
          studioId,
          startTime: {
            gte: sixMonthWindowStart,
            lt: now
          }
        },
        select: {
          startTime: true
        }
      })
    ])

    const upcomingClasses = upcomingClassesRaw.map((classSession) => {
      const clientAlertCount = classSession.bookings.reduce((count, booking) => {
        const healthIssues = booking.client.healthIssues?.trim()
        const classNotes = booking.client.classNotes?.trim()
        return healthIssues || classNotes ? count + 1 : count
      }, 0)

      return {
        ...classSession,
        clientAlertCount
      }
    })

    const performance = buildTeacherPerformanceSummary(monthPerformance.sessions, monthPerformance.bookings, 0)

    const monthlyClasses = buildMonthlyCountBuckets(now, 6)
    const monthlyClassesLookup = buildMonthlyBucketLookup(monthlyClasses)
    for (const classSession of sixMonthClasses) {
      addCountToMonthlyBuckets(monthlyClassesLookup, new Date(classSession.startTime))
    }

    return NextResponse.json({
      currency: (studio?.stripeCurrency || "usd").toLowerCase(),
      totalClasses: performance.totalClasses,
      totalStudents: performance.totalStudents,
      avgRating: null,
      ratingDataAvailable: false,
      revenue: performance.revenue,
      retentionRate: performance.retentionRate,
      avgFillRate: performance.avgFillRate,
      avgClassSize: performance.avgClassSize,
      completionRate: performance.completionRate,
      monthlyClasses,
      topClasses: performance.topClasses,
      recentReviews: [],
      upcomingClasses,
      recentClasses
    })
  } catch (error) {
    console.error("Failed to fetch teacher stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}












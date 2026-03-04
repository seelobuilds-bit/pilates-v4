import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildTeacherPerformanceSummary } from "@/lib/reporting/teacher-performance"
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

    const [studio, upcomingClassesRaw, recentClasses, monthClasses, monthBookings, sixMonthClasses] = await Promise.all([
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
          classType: {
            select: {
              name: true
            }
          },
          bookings: {
            select: {
              status: true
            }
          }
        }
      }),
      db.booking.findMany({
        where: {
          studioId,
          classSession: {
            teacherId,
            studioId,
            startTime: {
              gte: startOfMonth,
              lt: now
            }
          }
        },
        select: {
          status: true,
          clientId: true,
          paidAmount: true,
          classSession: {
            select: {
              classType: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        }
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

    const performance = buildTeacherPerformanceSummary(monthClasses, monthBookings, 0)

    const monthlyClassesMap = new Map<string, { month: string; count: number }>()
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      monthlyClassesMap.set(key, {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        count: 0
      })
    }

    for (const classSession of sixMonthClasses) {
      const date = new Date(classSession.startTime)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = monthlyClassesMap.get(key)
      if (bucket) {
        bucket.count += 1
      }
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
      monthlyClasses: Array.from(monthlyClassesMap.values()),
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














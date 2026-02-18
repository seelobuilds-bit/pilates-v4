import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { ratioPercentage, roundCurrency, roundTo } from "@/lib/reporting/metrics"

const ATTENDED_BOOKING_STATUSES = new Set(["CONFIRMED", "COMPLETED", "NO_SHOW"])

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

    const [upcomingClasses, recentClasses, monthClasses, monthBookings, sixMonthClasses] = await Promise.all([
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

    const nonCancelledBookings = monthBookings.filter((booking) => booking.status !== "CANCELLED")
    const uniqueStudents = new Set(nonCancelledBookings.map((booking) => booking.clientId))
    const completedBookings = nonCancelledBookings.filter((booking) => booking.status === "COMPLETED").length

    const revenue = nonCancelledBookings.reduce((sum, booking) => {
      const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
      return sum + amount
    }, 0)

    const totalAttendance = monthClasses.reduce((sum, session) => {
      return (
        sum +
        session.bookings.filter((booking) => ATTENDED_BOOKING_STATUSES.has(booking.status)).length
      )
    }, 0)

    const avgClassSize = monthClasses.length > 0 ? roundTo(totalAttendance / monthClasses.length, 1) : 0

    const avgFillRate =
      monthClasses.length > 0
        ? roundTo(
            monthClasses.reduce((sum, session) => {
              const attendedCount = session.bookings.filter((booking) =>
                ATTENDED_BOOKING_STATUSES.has(booking.status)
              ).length
              return sum + ratioPercentage(attendedCount, session.capacity, 4)
            }, 0) / monthClasses.length,
            0
          )
        : 0

    const completionRate = ratioPercentage(completedBookings, nonCancelledBookings.length, 0)

    const clientBookingCounts = new Map<string, number>()
    for (const booking of nonCancelledBookings) {
      clientBookingCounts.set(booking.clientId, (clientBookingCounts.get(booking.clientId) || 0) + 1)
    }
    const repeatClientCount = Array.from(clientBookingCounts.values()).filter((count) => count > 1).length
    const retentionRate = ratioPercentage(repeatClientCount, clientBookingCounts.size, 0)

    const classCounts = new Map<string, number>()
    for (const session of monthClasses) {
      classCounts.set(session.classType.name, (classCounts.get(session.classType.name) || 0) + 1)
    }

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

    const topClasses = Array.from(classCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      totalClasses: monthClasses.length,
      totalStudents: uniqueStudents.size,
      avgRating: null,
      ratingDataAvailable: false,
      revenue: roundCurrency(revenue),
      retentionRate,
      avgFillRate,
      avgClassSize,
      completionRate,
      monthlyClasses: Array.from(monthlyClassesMap.values()),
      topClasses,
      recentReviews: [],
      upcomingClasses,
      recentClasses
    })
  } catch (error) {
    console.error("Failed to fetch teacher stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
























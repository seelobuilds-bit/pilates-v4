import { NextRequest, NextResponse } from "next/server"
import { BookingStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { runDbQueries } from "@/lib/db-query-mode"
import { ratioPercentage, roundCurrency, roundTo } from "@/lib/reporting/metrics"

const ATTENDED_BOOKING_STATUSES = new Set(["CONFIRMED", "COMPLETED", "NO_SHOW"])
const ATTENDED_BOOKING_STATUS_LIST: BookingStatus[] = ["CONFIRMED", "COMPLETED", "NO_SHOW"]
const DEFAULT_REPORT_DAYS = 30
const MAX_REPORT_DAYS = 365
const DAY_IN_MS = 1000 * 60 * 60 * 24

type ReportRange = {
  days: number
  startDate: Date
  reportEndDate: Date
  previousStartDate: Date
}

function parseReportDays(value: string | null) {
  if (!value) return DEFAULT_REPORT_DAYS
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return DEFAULT_REPORT_DAYS
  return Math.min(MAX_REPORT_DAYS, Math.max(1, parsed))
}

function parseDateInput(value: string | null) {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function resolveReportRange(searchParams: URLSearchParams): ReportRange {
  const requestedStartDate = parseDateInput(searchParams.get("startDate"))
  const requestedEndDate = parseDateInput(searchParams.get("endDate"))

  if (
    requestedStartDate &&
    requestedEndDate &&
    requestedStartDate.getTime() <= requestedEndDate.getTime()
  ) {
    const startDate = new Date(requestedStartDate)
    const reportEndDate = new Date(requestedEndDate)
    // Use an exclusive upper bound at the start of the day after the selected end date.
    reportEndDate.setUTCDate(reportEndDate.getUTCDate() + 1)
    const days = Math.max(1, Math.round((reportEndDate.getTime() - startDate.getTime()) / DAY_IN_MS))
    const previousStartDate = new Date(startDate)
    previousStartDate.setUTCDate(previousStartDate.getUTCDate() - days)

    return { days, startDate, reportEndDate, previousStartDate }
  }

  const days = parseReportDays(searchParams.get("days"))
  const reportEndDate = new Date()
  const startDate = new Date(reportEndDate)
  startDate.setDate(startDate.getDate() - days)
  const previousStartDate = new Date(startDate)
  previousStartDate.setDate(previousStartDate.getDate() - days)

  return { days, startDate, reportEndDate, previousStartDate }
}

export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getSession>>
  try {
    session = await getSession()
  } catch (error) {
    console.error("Failed to resolve session for reports:", error)
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 })
  }

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studioId = session.user.studioId
  const searchParams = request.nextUrl.searchParams
  const { days, startDate, reportEndDate, previousStartDate } = resolveReportRange(searchParams)

  try {
    const monthWindowStart = new Date(reportEndDate)
    monthWindowStart.setMonth(monthWindowStart.getMonth() - 5)
    monthWindowStart.setDate(1)
    monthWindowStart.setHours(0, 0, 0, 0)

  const [bookings, previousBookings, monthlyBookings, classSessions] = await runDbQueries([
    () => db.booking.findMany({
      where: {
        studioId,
        classSession: {
          startTime: {
            gte: startDate,
            lt: reportEndDate
          }
        }
      },
      select: {
        status: true,
        clientId: true,
        paidAmount: true,
        classSession: {
          select: {
            startTime: true,
            teacherId: true,
            classType: {
              select: {
                name: true,
                price: true
              }
            },
            location: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        classSession: {
          startTime: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      },
      select: {
        status: true,
        paidAmount: true,
        classSession: {
          select: {
            teacherId: true,
            classType: {
              select: {
                price: true
              }
            }
          }
        }
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        classSession: {
          startTime: {
            gte: monthWindowStart,
            lt: reportEndDate
          }
        }
      },
      select: {
        status: true,
        classSession: {
          select: {
            startTime: true,
            classType: {
              select: {
                price: true
              }
            }
          }
        },
        paidAmount: true
      }
    }),
    () => db.classSession.findMany({
      where: {
        studioId,
        startTime: {
          gte: startDate,
          lt: reportEndDate
        }
      },
      select: {
        id: true,
        studioId: true,
        teacherId: true,
        classTypeId: true,
        capacity: true,
        startTime: true,
        classType: {
          select: {
            name: true,
            price: true
          }
        },
        location: {
          select: {
            name: true
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        bookings: {
          select: {
            status: true,
            paidAmount: true,
            clientId: true
          }
        },
        _count: {
          select: { waitlists: true }
        }
      }
    })
  ])

  const [
    totalClients,
    newClients,
    activeClients,
    churnedClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod
  ] = await runDbQueries([
    () => db.client.count({ where: { studioId } }),
    () => db.client.count({
      where: {
        studioId,
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        }
      }
    }),
    () => db.client.count({
      where: {
        studioId,
        isActive: true
      }
    }),
    () => db.client.count({
      where: {
        studioId,
        isActive: false
      }
    }),
    () => db.classSession.groupBy({
      by: ["teacherId"] as const,
      where: {
        studioId,
        startTime: {
          gte: previousStartDate,
          lt: startDate
        }
      },
      _count: {
        teacherId: true
      },
      orderBy: {
        teacherId: "asc"
      }
    }),
    () => db.teacher.findMany({
      where: {
        studioId
      },
      select: {
        id: true,
        isActive: true,
        specialties: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    () => db.client.findMany({
      where: {
        studioId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        credits: true,
        createdAt: true
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        status: "CANCELLED",
        classSession: {
          startTime: {
            gte: startDate,
            lt: reportEndDate
          }
        }
      },
      select: {
        cancellationReason: true
      }
    })
  ])

  const [periodMessages, previousPeriodMessages, reminderAutomations, winbackAutomations] = await runDbQueries([
    () => db.message.findMany({
      where: {
        studioId,
        direction: "OUTBOUND",
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        }
      },
      select: {
        id: true,
        channel: true,
        status: true,
        clientId: true,
        campaignId: true,
        automationId: true,
        openedAt: true,
        clickedAt: true
      }
    }),
    () => db.message.findMany({
      where: {
        studioId,
        direction: "OUTBOUND",
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      },
      select: {
        id: true,
        channel: true,
        status: true,
        clientId: true,
        campaignId: true,
        automationId: true,
        openedAt: true,
        clickedAt: true
      }
    }),
    () => db.automation.findMany({
      where: {
        studioId,
        trigger: "CLASS_REMINDER"
      },
      select: {
        id: true
      }
    }),
    () => db.automation.findMany({
      where: {
        studioId,
        trigger: "CLIENT_INACTIVE"
      },
      select: {
        id: true
      }
    })
  ])

  const [activeSocialFlows, totalSocialTriggered, totalSocialResponded, totalSocialBooked] = await runDbQueries([
    () => db.socialMediaFlow.count({
      where: {
        isActive: true,
        account: {
          OR: [{ studioId }, { teacher: { studioId } }]
        }
      }
    }),
    () => db.socialMediaFlowEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        },
        flow: {
          account: {
            OR: [{ studioId }, { teacher: { studioId } }]
          }
        }
      }
    }),
    () => db.socialMediaFlowEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        },
        responseSent: true,
        flow: {
          account: {
            OR: [{ studioId }, { teacher: { studioId } }]
          }
        }
      }
    }),
    () => db.socialMediaFlowEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        },
        converted: true,
        flow: {
          account: {
            OR: [{ studioId }, { teacher: { studioId } }]
          }
        }
      }
    })
  ])

  const activityLookbackStart = new Date(reportEndDate)
  activityLookbackStart.setDate(activityLookbackStart.getDate() - 365)

  const activeClientVisitRows = await db.booking.findMany({
    where: {
      studioId,
      status: {
        in: ATTENDED_BOOKING_STATUS_LIST
      },
      client: {
        isActive: true
      },
      classSession: {
        startTime: {
          gte: activityLookbackStart,
          lt: reportEndDate
        }
      }
    },
    select: {
      clientId: true,
      classSession: {
        select: {
          startTime: true
        }
      }
    },
    orderBy: {
      classSession: {
        startTime: "desc"
      }
    }
  })

  const revenueByLocation: Record<string, number> = {}
  const revenueByClassType: Record<string, number> = {}
  let totalRevenue = 0

  for (const booking of bookings) {
    if (booking.status === "CANCELLED") continue
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    totalRevenue += amount

    const locationName = booking.classSession.location.name
    revenueByLocation[locationName] = (revenueByLocation[locationName] || 0) + amount

    const className = booking.classSession.classType.name
    revenueByClassType[className] = (revenueByClassType[className] || 0) + amount
  }

  const previousTotalRevenue = previousBookings.reduce((sum, booking) => {
    if (booking.status === "CANCELLED") return sum
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    return sum + amount
  }, 0)

  const monthlyRevenueMap = new Map<string, { month: string; amount: number; target: number }>()
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthlyRevenueMap.set(key, {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      amount: 0,
      target: 0
    })
  }
  for (const booking of monthlyBookings) {
    if (booking.status === "CANCELLED") continue
    const date = new Date(booking.classSession.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthlyRevenueMap.get(key)
    if (!bucket) continue
    const amount = booking.paidAmount ?? booking.classSession.classType.price ?? 0
    bucket.amount += amount
  }
  for (const bucket of monthlyRevenueMap.values()) {
    bucket.target = bucket.amount
  }

  const classesByLocation: Record<string, number> = {}
  const classesByTeacher: Record<string, number> = {}
  const byTimeSlotMap = new Map<string, { time: string; fillTotal: number; classes: number }>()
  const byDayMap = new Map<string, { day: string; fillTotal: number; classes: number }>()
  const byClassTypeMap = new Map<
    string,
    {
      id: string
      name: string
      fillTotal: number
      classes: number
      waitlist: number
    }
  >()

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  for (const day of dayOrder) {
    byDayMap.set(day, { day, fillTotal: 0, classes: 0 })
  }

  for (const session of classSessions) {
    classesByLocation[session.location.name] = (classesByLocation[session.location.name] || 0) + 1
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`
    classesByTeacher[teacherName] = (classesByTeacher[teacherName] || 0) + 1

    const attendedCount = session.bookings.filter((booking) => ATTENDED_BOOKING_STATUSES.has(booking.status)).length
    const fill = ratioPercentage(attendedCount, session.capacity, 0)

    const slotLabel = new Date(session.startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    })
    const slotEntry = byTimeSlotMap.get(slotLabel) || { time: slotLabel, fillTotal: 0, classes: 0 }
    slotEntry.fillTotal += fill
    slotEntry.classes += 1
    byTimeSlotMap.set(slotLabel, slotEntry)

    const dayLabel = new Date(session.startTime).toLocaleDateString("en-US", { weekday: "short" })
    const dayEntry = byDayMap.get(dayLabel) || { day: dayLabel, fillTotal: 0, classes: 0 }
    dayEntry.fillTotal += fill
    dayEntry.classes += 1
    byDayMap.set(dayLabel, dayEntry)

    const classEntry = byClassTypeMap.get(session.classTypeId) || {
      id: session.classTypeId,
      name: session.classType.name,
      fillTotal: 0,
      classes: 0,
      waitlist: 0
    }
    classEntry.fillTotal += fill
    classEntry.classes += 1
    classEntry.waitlist += session._count.waitlists
    byClassTypeMap.set(session.classTypeId, classEntry)
  }
  const totalCapacity = classSessions.reduce((sum, session) => sum + session.capacity, 0)
  const totalAttendance = classSessions.reduce((sum, session) => {
    return (
      sum +
      session.bookings.filter((booking) => ATTENDED_BOOKING_STATUSES.has(booking.status)).length
    )
  }, 0)
  const overallAverageFill =
    classSessions.length > 0
      ? roundTo(
          classSessions.reduce((sum, session) => {
            const attendedCount = session.bookings.filter((booking) => ATTENDED_BOOKING_STATUSES.has(booking.status)).length
            return sum + ratioPercentage(attendedCount, session.capacity, 4)
          }, 0) / classSessions.length,
          0
        )
      : 0

  const statusCounts: Record<string, number> = {}
  for (const booking of bookings) {
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
  }

  const validBookings = bookings.filter((booking) => booking.status !== "CANCELLED")
  const clientCreatedAtById = new Map(studioClients.map((client) => [client.id, client.createdAt]))
  const uniqueBookedClients = new Set(validBookings.map((booking) => booking.clientId))
  const newClientBookings = validBookings.filter((booking) => {
    const createdAt = clientCreatedAtById.get(booking.clientId)
    return createdAt ? createdAt >= startDate && createdAt < reportEndDate : false
  }).length
  const averageBookingsPerClient = roundTo(
    uniqueBookedClients.size > 0 ? validBookings.length / uniqueBookedClients.size : 0,
    2
  )

  const periodEmailMessages = periodMessages.filter((message) => message.channel === "EMAIL")
  const previousPeriodEmailMessages = previousPeriodMessages.filter((message) => message.channel === "EMAIL")
  const emailsSent = periodEmailMessages.length
  const openedEmails = periodEmailMessages.filter(
    (message) => message.openedAt || message.status === "OPENED" || message.status === "CLICKED"
  ).length
  const clickedEmails = periodEmailMessages.filter(
    (message) => message.clickedAt || message.status === "CLICKED"
  ).length
  const previousEmailsSent = previousPeriodEmailMessages.length
  const previousOpenedEmails = previousPeriodEmailMessages.filter(
    (message) => message.openedAt || message.status === "OPENED" || message.status === "CLICKED"
  ).length
  const previousClickedEmails = previousPeriodEmailMessages.filter(
    (message) => message.clickedAt || message.status === "CLICKED"
  ).length

  const emailOpenRate = ratioPercentage(openedEmails, emailsSent, 1)
  const emailClickRate = ratioPercentage(clickedEmails, emailsSent, 1)
  const previousEmailOpenRate = ratioPercentage(previousOpenedEmails, previousEmailsSent, 1)
  const previousEmailClickRate = ratioPercentage(previousClickedEmails, previousEmailsSent, 1)

  const emailRecipientClientIds = Array.from(
    new Set(
      periodEmailMessages
        .map((message) => message.clientId)
        .filter((clientId): clientId is string => Boolean(clientId))
    )
  )

  const bookingsByEmailRecipient = emailRecipientClientIds.length
    ? await db.booking.groupBy({
        by: ["clientId"],
        where: {
          studioId,
          clientId: {
            in: emailRecipientClientIds
          },
          status: {
            in: ["CONFIRMED", "COMPLETED", "NO_SHOW"]
          },
          classSession: {
            startTime: {
              gte: startDate,
              lt: reportEndDate
            }
          }
        },
        _count: {
          clientId: true
        }
      })
    : []

  const bookingsByClientId = new Map<string, number>()
  for (const row of bookingsByEmailRecipient) {
    bookingsByClientId.set(row.clientId, row._count.clientId)
  }

  const campaignBuckets = new Map<
    string,
    {
      sent: number
      opened: number
      clicked: number
      clients: Set<string>
    }
  >()
  for (const message of periodEmailMessages) {
    if (!message.campaignId) continue
    const existing = campaignBuckets.get(message.campaignId) || {
      sent: 0,
      opened: 0,
      clicked: 0,
      clients: new Set<string>()
    }
    existing.sent += 1
    if (message.openedAt || message.status === "OPENED" || message.status === "CLICKED") {
      existing.opened += 1
    }
    if (message.clickedAt || message.status === "CLICKED") {
      existing.clicked += 1
    }
    if (message.clientId) {
      existing.clients.add(message.clientId)
    }
    campaignBuckets.set(message.campaignId, existing)
  }

  const campaignIds = Array.from(campaignBuckets.keys())
  const campaignDefinitions = campaignIds.length
    ? await db.campaign.findMany({
        where: {
          studioId,
          id: {
            in: campaignIds
          }
        },
        select: {
          id: true,
          name: true
        }
      })
    : []
  const campaignNameById = new Map(campaignDefinitions.map((campaign) => [campaign.id, campaign.name]))

  const campaignRows = campaignIds
    .map((campaignId) => {
      const bucket = campaignBuckets.get(campaignId)
      if (!bucket) return null
      const attributedBookings = Array.from(bucket.clients).filter(
        (clientId) => (bookingsByClientId.get(clientId) || 0) > 0
      ).length
      return {
        id: campaignId,
        name: campaignNameById.get(campaignId) || "Campaign",
        sent: bucket.sent,
        opened: bucket.opened,
        clicked: bucket.clicked,
        bookings: attributedBookings
      }
    })
    .filter((campaign): campaign is NonNullable<typeof campaign> => campaign !== null)
    .sort((a, b) => b.sent - a.sent || a.name.localeCompare(b.name))
    .slice(0, 10)

  const bookingsFromEmail = bookingsByEmailRecipient.length

  const reminderAutomationIds = new Set(reminderAutomations.map((automation) => automation.id))
  const remindersSent = periodMessages.filter(
    (message) => message.automationId && reminderAutomationIds.has(message.automationId)
  ).length

  const winbackAutomationIds = new Set(winbackAutomations.map((automation) => automation.id))
  const winbackClientIds = Array.from(
    new Set(
      periodMessages
        .filter((message) => message.automationId && winbackAutomationIds.has(message.automationId))
        .map((message) => message.clientId)
        .filter((clientId): clientId is string => Boolean(clientId))
    )
  )

  const winbackRecoveredClients = winbackClientIds.length
    ? await db.booking.findMany({
        where: {
          studioId,
          clientId: {
            in: winbackClientIds
          },
          status: {
            in: ["CONFIRMED", "COMPLETED", "NO_SHOW"]
          },
          classSession: {
            startTime: {
              gte: startDate,
              lt: reportEndDate
            }
          }
        },
        select: {
          clientId: true
        },
        distinct: ["clientId"]
      })
    : []

  const winbackSuccess = winbackRecoveredClients.length

  const attendedBookingsThisPeriod = bookings.filter((booking) =>
    ATTENDED_BOOKING_STATUSES.has(booking.status)
  )
  const attendedBookingsPreviousPeriod = previousBookings.filter((booking) =>
    ATTENDED_BOOKING_STATUSES.has(booking.status)
  )
  const noShowRate = ratioPercentage(
    attendedBookingsThisPeriod.filter((booking) => booking.status === "NO_SHOW").length,
    attendedBookingsThisPeriod.length,
    1
  )
  const previousNoShowRate = ratioPercentage(
    attendedBookingsPreviousPeriod.filter((booking) => booking.status === "NO_SHOW").length,
    attendedBookingsPreviousPeriod.length,
    1
  )

  const socialConversionRate = ratioPercentage(totalSocialBooked, totalSocialTriggered, 1)

  const previousClassCountByTeacherId = new Map(
    previousClassCounts.map((row) => {
      const count =
        typeof row._count === "object" &&
        row._count !== null &&
        "teacherId" in row._count &&
        typeof row._count.teacherId === "number"
          ? row._count.teacherId
          : 0
      return [row.teacherId, count] as const
    })
  )
  const teacherMetaById = new Map(
    studioTeachers.map((teacher) => [
      teacher.id,
      {
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        specialties: teacher.specialties,
        isActive: teacher.isActive
      }
    ])
  )
  const instructorBuckets = new Map<
    string,
    {
      id: string
      name: string
      specialties: string[]
      classes: number
      totalCapacity: number
      attended: number
      revenue: number
      rating: number | null
      previousClasses: number
      clientVisits: Map<string, number>
    }
  >()

  for (const session of classSessions) {
    const teacherName = `${session.teacher.user.firstName} ${session.teacher.user.lastName}`
    const teacherSpecialties = teacherMetaById.get(session.teacherId)?.specialties || []
    const bucket =
      instructorBuckets.get(session.teacherId) || {
        id: session.teacherId,
        name: teacherName,
        specialties: teacherSpecialties,
        classes: 0,
        totalCapacity: 0,
        attended: 0,
        revenue: 0,
        rating: null,
        previousClasses: previousClassCountByTeacherId.get(session.teacherId) || 0,
        clientVisits: new Map<string, number>()
      }

    bucket.classes += 1
    bucket.totalCapacity += session.capacity

    for (const booking of session.bookings) {
      if (booking.status !== "CANCELLED") {
        const amount = booking.paidAmount ?? session.classType.price ?? 0
        bucket.revenue += amount
      }
      if (!ATTENDED_BOOKING_STATUSES.has(booking.status)) continue
      bucket.attended += 1
      bucket.clientVisits.set(booking.clientId, (bucket.clientVisits.get(booking.clientId) || 0) + 1)
    }

    instructorBuckets.set(session.teacherId, bucket)
  }

  for (const teacher of studioTeachers) {
    if (!teacher.isActive || instructorBuckets.has(teacher.id)) continue
    const name = `${teacher.user.firstName} ${teacher.user.lastName}`
    instructorBuckets.set(teacher.id, {
      id: teacher.id,
      name,
      specialties: teacher.specialties,
      classes: 0,
      totalCapacity: 0,
      attended: 0,
      revenue: 0,
      rating: null,
      previousClasses: previousClassCountByTeacherId.get(teacher.id) || 0,
      clientVisits: new Map<string, number>()
    })
  }

  const instructorRows = Array.from(instructorBuckets.values())
    .map((bucket) => {
      const uniqueClients = bucket.clientVisits.size
      const repeatClients = Array.from(bucket.clientVisits.values()).filter((count) => count > 1).length
      const avgFill = ratioPercentage(bucket.attended, bucket.totalCapacity, 0)
      const retention = ratioPercentage(repeatClients, uniqueClients, 1)
      const trend =
        bucket.classes > bucket.previousClasses
          ? "up"
          : bucket.classes < bucket.previousClasses
            ? "down"
            : "stable"

      return {
        id: bucket.id,
        name: bucket.name,
        classes: bucket.classes,
        avgFill,
        revenue: roundCurrency(bucket.revenue),
        rating: bucket.rating,
        retention,
        trend,
        specialties: bucket.specialties
      }
    })
    .sort((a, b) => b.classes - a.classes || a.name.localeCompare(b.name))

  const activeClientsList = studioClients.filter((client) => client.isActive)
  const riskCutoff = new Date(reportEndDate)
  riskCutoff.setDate(riskCutoff.getDate() - 14)
  const highRiskCutoff = new Date(reportEndDate)
  highRiskCutoff.setDate(highRiskCutoff.getDate() - 30)
  const recentActivityCutoff = new Date(reportEndDate)
  recentActivityCutoff.setDate(recentActivityCutoff.getDate() - 30)

  const visitCountByClientId = new Map<string, number>()
  const lastVisitByClientId = new Map<string, Date>()
  const recentlyActiveClientIds = new Set<string>()
  for (const visit of activeClientVisitRows) {
    visitCountByClientId.set(visit.clientId, (visitCountByClientId.get(visit.clientId) || 0) + 1)
    if (!lastVisitByClientId.has(visit.clientId)) {
      lastVisitByClientId.set(visit.clientId, visit.classSession.startTime)
    }
    if (visit.classSession.startTime >= recentActivityCutoff) {
      recentlyActiveClientIds.add(visit.clientId)
    }
  }

  const atRiskCandidates = activeClientsList
    .map((client) => {
      const lastVisit = lastVisitByClientId.get(client.id) || null
      const visits = visitCountByClientId.get(client.id) || 0
      const isAtRisk = !lastVisit || lastVisit < riskCutoff
      const status = !lastVisit || lastVisit < highRiskCutoff ? "high-risk" : "medium-risk"
      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        lastVisit,
        visits,
        isAtRisk,
        status
      }
    })
    .filter((client) => client.isAtRisk)
    .sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return a.name.localeCompare(b.name)
      if (!a.lastVisit) return -1
      if (!b.lastVisit) return 1
      return a.lastVisit.getTime() - b.lastVisit.getTime()
    })

  const atRiskList = atRiskCandidates.slice(0, 10).map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    lastVisit: client.lastVisit
      ? client.lastVisit.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never",
    visits: client.visits,
    status: client.status
  }))

  const cohortRanges = [
    { label: "0-30 days", min: 0, max: 30 },
    { label: "31-90 days", min: 31, max: 90 },
    { label: "91-180 days", min: 91, max: 180 },
    { label: "181+ days", min: 181, max: Number.POSITIVE_INFINITY }
  ]

  const cohortBuckets = cohortRanges.map((range) => ({
    cohort: range.label,
    total: 0,
    retained: 0
  }))
  for (const client of activeClientsList) {
    const ageInDays = Math.floor((reportEndDate.getTime() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const bucketIndex = cohortRanges.findIndex((range) => ageInDays >= range.min && ageInDays <= range.max)
    if (bucketIndex < 0) continue
    cohortBuckets[bucketIndex].total += 1
    if (recentlyActiveClientIds.has(client.id)) {
      cohortBuckets[bucketIndex].retained += 1
    }
  }
  const cohortRetention = cohortBuckets.map((bucket) => ({
    cohort: bucket.cohort,
    retained: ratioPercentage(bucket.retained, bucket.total, 1)
  }))

  const cancellationReasonCounts = new Map<string, number>()
  for (const booking of cancelledBookingsInPeriod) {
    const reason = booking.cancellationReason?.trim() || "No reason provided"
    cancellationReasonCounts.set(reason, (cancellationReasonCounts.get(reason) || 0) + 1)
  }
  const churnReasons = Array.from(cancellationReasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const membershipBuckets = [
    { type: "No credits", count: 0 },
    { type: "1-4 credits", count: 0 },
    { type: "5-9 credits", count: 0 },
    { type: "10+ credits", count: 0 }
  ]
  for (const client of activeClientsList) {
    if (client.credits <= 0) membershipBuckets[0].count += 1
    else if (client.credits <= 4) membershipBuckets[1].count += 1
    else if (client.credits <= 9) membershipBuckets[2].count += 1
    else membershipBuckets[3].count += 1
  }
  const membershipBreakdown = membershipBuckets.map((bucket) => ({
    type: bucket.type,
    count: bucket.count,
    percent: ratioPercentage(bucket.count, activeClientsList.length, 1)
  }))

  const marketingInsights =
    emailsSent > 0
      ? [
          {
            type: emailOpenRate >= previousEmailOpenRate ? "positive" : "warning",
            message: `Email open rate is ${emailOpenRate}% (${emailOpenRate - previousEmailOpenRate >= 0 ? "+" : ""}${(
              emailOpenRate - previousEmailOpenRate
            ).toFixed(1)}pp vs previous period).`
          },
          {
            type: bookingsFromEmail > 0 ? "positive" : "info",
            message:
              bookingsFromEmail > 0
                ? `${bookingsFromEmail} email recipients booked at least once in this period.`
                : "No email recipients have booked in this period yet."
          },
          {
            type: noShowRate <= previousNoShowRate ? "positive" : "warning",
            message: `No-show rate is ${noShowRate}% (${noShowRate <= previousNoShowRate ? "improved" : "up"} from ${previousNoShowRate}%).`
          }
        ]
      : [
          { type: "info", message: "No outbound email activity yet in this period." },
          { type: "info", message: "Launch a campaign or automation to start collecting marketing performance data." }
        ]

  const byTimeSlot = Array.from(byTimeSlotMap.values())
    .map((item) => ({
      time: item.time,
      fill: item.classes > 0 ? roundTo(item.fillTotal / item.classes, 0) : 0,
      classes: item.classes
    }))
    .sort((a, b) => b.fill - a.fill)

  const byDay = Array.from(byDayMap.values()).map((item) => ({
    day: item.day,
    fill: item.classes > 0 ? roundTo(item.fillTotal / item.classes, 0) : 0,
    classes: item.classes
  }))

  const classFillRows = Array.from(byClassTypeMap.values()).map((item) => ({
    id: item.id,
    name: item.name,
    fill: item.classes > 0 ? roundTo(item.fillTotal / item.classes, 0) : 0,
    waitlist: item.waitlist
  }))

  const topClasses = [...classFillRows]
    .sort((a, b) => b.fill - a.fill)
    .slice(0, 5)

  const underperforming = [...classFillRows]
    .filter((item) => item.fill < overallAverageFill)
    .sort((a, b) => a.fill - b.fill)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      fill: item.fill,
      avgFill: overallAverageFill
    }))

    return NextResponse.json({
    revenue: {
      total: totalRevenue,
      previousTotal: previousTotalRevenue,
      byLocation: Object.entries(revenueByLocation).map(([name, amount]) => ({ name, amount })),
      byClassType: Object.entries(revenueByClassType).map(([name, amount]) => ({ name, amount })),
      monthly: Array.from(monthlyRevenueMap.values())
    },
    clients: {
      total: totalClients,
      new: newClients,
      active: activeClients,
      churned: churnedClients
    },
    instructors: instructorRows,
    retention: {
      atRiskClients: atRiskCandidates.length,
      atRiskList,
      membershipBreakdown,
      churnReasons,
      cohortRetention,
      churnRate: ratioPercentage(churnedClients, totalClients, 1),
      churnDefinition: "inactive clients / total clients"
    },
    classes: {
      total: classSessions.length,
      totalCapacity,
      totalAttendance,
      averageFill: overallAverageFill,
      byLocation: Object.entries(classesByLocation).map(([name, count]) => ({ name, count })),
      byTeacher: Object.entries(classesByTeacher).map(([name, count]) => ({ name, count })),
      byTimeSlot,
      byDay,
      topClasses,
      underperforming
    },
    bookings: {
      total: validBookings.length,
      uniqueClients: uniqueBookedClients.size,
      newClientBookings,
      averageBookingsPerClient,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    },
    marketing: {
      emailsSent,
      emailOpenRate,
      emailClickRate,
      previousEmailOpenRate,
      previousEmailClickRate,
      bookingsFromEmail,
      remindersSent,
      noShowRate,
      previousNoShowRate,
      winbackSuccess,
      campaigns: campaignRows,
      insights: marketingInsights
    },
    social: {
      activeFlows: activeSocialFlows,
      totalTriggered: totalSocialTriggered,
      totalResponded: totalSocialResponded,
      totalBooked: totalSocialBooked,
      conversionRate: socialConversionRate
    },
    range: {
      days,
      startDate: startDate.toISOString(),
      endDate: reportEndDate.toISOString()
    }
    })
  } catch (error) {
    console.error("Failed to load full reports payload:", error)

    try {
      const [totalClients, activeClients, churnedClients, newClients] = await runDbQueries([
        () => db.client.count({ where: { studioId } }),
        () => db.client.count({ where: { studioId, isActive: true } }),
        () => db.client.count({ where: { studioId, isActive: false } }),
        () => db.client.count({
          where: {
            studioId,
            createdAt: {
              gte: startDate,
              lt: reportEndDate
            }
          }
        })
      ])

      return NextResponse.json({
        revenue: {
          total: 0,
          previousTotal: 0,
          byLocation: [],
          byClassType: [],
          monthly: []
        },
        clients: {
          total: totalClients,
          new: newClients,
          active: activeClients,
          churned: churnedClients
        },
        instructors: [],
        retention: {
          atRiskClients: 0,
          atRiskList: [],
          membershipBreakdown: [],
          churnReasons: [],
          cohortRetention: []
        },
        classes: {
          total: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          averageFill: 0,
          byLocation: [],
          byTeacher: [],
          byTimeSlot: [],
          byDay: [],
          topClasses: [],
          underperforming: []
        },
        bookings: {
          total: 0,
          uniqueClients: 0,
          newClientBookings: 0,
          averageBookingsPerClient: 0,
          byStatus: []
        },
        marketing: {
          emailsSent: 0,
          emailOpenRate: 0,
          emailClickRate: 0,
          previousEmailOpenRate: 0,
          previousEmailClickRate: 0,
          bookingsFromEmail: 0,
          remindersSent: 0,
          noShowRate: 0,
          previousNoShowRate: 0,
          winbackSuccess: 0,
          campaigns: [],
          insights: [{ type: "warning", message: "Partial reports payload returned due to data timeout. Retry shortly." }]
        },
        social: {
          activeFlows: 0,
          totalTriggered: 0,
          totalResponded: 0,
          totalBooked: 0,
          conversionRate: 0
        },
        range: {
          days,
          startDate: startDate.toISOString(),
          endDate: reportEndDate.toISOString()
        },
        partial: true
      })
    } catch (fallbackError) {
      console.error("Failed to build fallback reports payload:", fallbackError)
      return NextResponse.json({
        revenue: {
          total: 0,
          previousTotal: 0,
          byLocation: [],
          byClassType: [],
          monthly: []
        },
        clients: {
          total: 0,
          new: 0,
          active: 0,
          churned: 0
        },
        instructors: [],
        retention: {
          atRiskClients: 0,
          atRiskList: [],
          membershipBreakdown: [],
          churnReasons: [],
          cohortRetention: [],
          churnRate: 0,
          churnDefinition: "inactive clients / total clients"
        },
        classes: {
          total: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          averageFill: 0,
          byLocation: [],
          byTeacher: [],
          byTimeSlot: [],
          byDay: [],
          topClasses: [],
          underperforming: []
        },
        bookings: {
          total: 0,
          uniqueClients: 0,
          newClientBookings: 0,
          averageBookingsPerClient: 0,
          byStatus: []
        },
        marketing: {
          emailsSent: 0,
          emailOpenRate: 0,
          emailClickRate: 0,
          previousEmailOpenRate: 0,
          previousEmailClickRate: 0,
          bookingsFromEmail: 0,
          remindersSent: 0,
          noShowRate: 0,
          previousNoShowRate: 0,
          winbackSuccess: 0,
          campaigns: [],
          insights: [{ type: "warning", message: "Reports are temporarily degraded. Retry in a moment." }]
        },
        social: {
          activeFlows: 0,
          totalTriggered: 0,
          totalResponded: 0,
          totalBooked: 0,
          conversionRate: 0
        },
        range: {
          days,
          startDate: startDate.toISOString(),
          endDate: reportEndDate.toISOString()
        },
        partial: true
      })
    }
  }
}

import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"
import { mapClientSummaryCountResults } from "./client-summary-counts"
import { buildClientSummaryCountQueries } from "./client-summary-query"

export async function fetchStudioReportClassSessionsWindow(args: {
  studioId: string
  startDate: Date
  endDate: Date
}) {
  const { studioId, startDate, endDate } = args
  return db.classSession.findMany({
    where: {
      studioId,
      startTime: {
        gte: startDate,
        lt: endDate,
      },
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
          price: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
      teacher: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      bookings: {
        select: {
          status: true,
          paidAmount: true,
          clientId: true,
        },
      },
      _count: {
        select: { waitlists: true },
      },
    },
  })
}

export async function fetchStudioReportBaseData(args: {
  studioId: string
  startDate: Date
  reportEndDate: Date
  previousStartDate: Date
}) {
  const { studioId, startDate, reportEndDate, previousStartDate } = args

  const monthWindowStart = new Date(reportEndDate)
  monthWindowStart.setMonth(monthWindowStart.getMonth() - 5)
  monthWindowStart.setDate(1)
  monthWindowStart.setHours(0, 0, 0, 0)

  const [bookings, previousBookings, monthlyBookings, classSessions] = await runDbQueries([
    () =>
      db.booking.findMany({
        where: {
          studioId,
          classSession: {
            startTime: {
              gte: startDate,
              lt: reportEndDate,
            },
          },
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
                  price: true,
                },
              },
              location: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    () =>
      db.booking.findMany({
        where: {
          studioId,
          classSession: {
            startTime: {
              gte: previousStartDate,
              lt: startDate,
            },
          },
        },
        select: {
          status: true,
          paidAmount: true,
          classSession: {
            select: {
              teacherId: true,
              classType: {
                select: {
                  price: true,
                },
              },
            },
          },
        },
      }),
    () =>
      db.booking.findMany({
        where: {
          studioId,
          classSession: {
            startTime: {
              gte: monthWindowStart,
              lt: reportEndDate,
            },
          },
        },
        select: {
          status: true,
          classSession: {
            select: {
              startTime: true,
              classType: {
                select: {
                  price: true,
                },
              },
            },
          },
          paidAmount: true,
        },
      }),
    () =>
      fetchStudioReportClassSessionsWindow({
        studioId,
        startDate,
        endDate: reportEndDate,
      }),
  ])

  const clientCountQueries = buildClientSummaryCountQueries({
    studioId,
    startDate,
    endDate: reportEndDate,
  })

  const [
    totalClients,
    activeClients,
    churnedClients,
    newClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod,
  ] = await runDbQueries([
    ...clientCountQueries,
    () =>
      db.classSession.groupBy({
        by: ["teacherId"] as const,
        where: {
          studioId,
          startTime: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
        _count: {
          teacherId: true,
        },
        orderBy: {
          teacherId: "asc",
        },
      }),
    () =>
      db.teacher.findMany({
        where: {
          studioId,
        },
        select: {
          id: true,
          isActive: true,
          specialties: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    () =>
      db.client.findMany({
        where: {
          studioId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          credits: true,
          createdAt: true,
        },
      }),
    () =>
      db.booking.findMany({
        where: {
          studioId,
          status: "CANCELLED",
          classSession: {
            startTime: {
              gte: startDate,
              lt: reportEndDate,
            },
          },
        },
        select: {
          cancellationReason: true,
        },
      }),
  ])

  const clientCounts = mapClientSummaryCountResults({
    totalClients,
    activeClients,
    churnedClients,
    newClients,
  })

  return {
    bookings,
    previousBookings,
    monthlyBookings,
    classSessions,
    totalClients: clientCounts.totalClients,
    newClients: clientCounts.newClients,
    activeClients: clientCounts.activeClients,
    churnedClients: clientCounts.churnedClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod,
  }
}

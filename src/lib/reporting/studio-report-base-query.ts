import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"

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
      db.classSession.findMany({
        where: {
          studioId,
          startTime: {
            gte: startDate,
            lt: reportEndDate,
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
      }),
  ])

  const [
    totalClients,
    newClients,
    activeClients,
    churnedClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod,
  ] = await runDbQueries([
    () => db.client.count({ where: { studioId } }),
    () =>
      db.client.count({
        where: {
          studioId,
          createdAt: {
            gte: startDate,
            lt: reportEndDate,
          },
        },
      }),
    () =>
      db.client.count({
        where: {
          studioId,
          isActive: true,
        },
      }),
    () =>
      db.client.count({
        where: {
          studioId,
          isActive: false,
        },
      }),
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

  return {
    bookings,
    previousBookings,
    monthlyBookings,
    classSessions,
    totalClients,
    newClients,
    activeClients,
    churnedClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod,
  }
}

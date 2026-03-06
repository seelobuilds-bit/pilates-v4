import { runDbQueries } from "@/lib/db-query-mode"
import { db } from "@/lib/db"
import { fetchStudioReportClassSessionsWindow } from "./studio-report-base-query"

export async function loadMobileOwnerReportData(args: {
  studioId: string
  currentStart: Date
  previousStart: Date
  periodEnd: Date
}) {
  const { studioId, currentStart, previousStart, periodEnd } = args

  const [baseRows, previousSessions] = await Promise.all([
    runDbQueries([
      () =>
        db.booking.findMany({
          where: {
            studioId,
            classSession: {
              startTime: {
                gte: currentStart,
                lt: periodEnd,
              },
            },
          },
          select: {
            status: true,
            paidAmount: true,
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
          },
        }),
      () =>
        db.booking.findMany({
          where: {
            studioId,
            classSession: {
              startTime: {
                gte: previousStart,
                lt: currentStart,
              },
            },
          },
          select: {
            status: true,
            paidAmount: true,
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
          },
        }),
      () =>
        db.classSession.findMany({
          where: {
            studioId,
            startTime: {
              gte: currentStart,
              lt: periodEnd,
            },
          },
          select: {
            startTime: true,
            capacity: true,
            classType: { select: { name: true } },
            bookings: {
              select: {
                status: true,
              },
            },
          },
        }),
      () =>
        db.client.findMany({
          where: {
            studioId,
            createdAt: {
              gte: currentStart,
              lt: periodEnd,
            },
          },
          select: {
            createdAt: true,
          },
        }),
      () =>
        db.client.count({
          where: {
            studioId,
            createdAt: {
              gte: previousStart,
              lt: currentStart,
            },
          },
        }),
    ]),
    fetchStudioReportClassSessionsWindow({
      studioId,
      startDate: previousStart,
      endDate: currentStart,
    }),
  ])

  const [bookings, previousBookings, classSessions, currentClientRows, previousNewClients] = baseRows

  const currentBase = {
    bookings,
    previousBookings,
    classSessions,
    studioClients: currentClientRows,
    newClients: currentClientRows.length,
    previousNewClients,
  }

  return {
    currentBase,
    previousSessions,
  }
}

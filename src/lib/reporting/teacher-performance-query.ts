import { db } from "@/lib/db"

export type TeacherPerformanceSessionRow = {
  startTime: Date
  capacity: number
  classType: {
    name: string
  } | null
  bookings: Array<{
    status: string
  }>
}

export type TeacherPerformanceBookingRow = {
  status: string
  clientId: string
  paidAmount: number | null
  classSession: {
    startTime: Date
    classType: {
      price: number
    }
  }
}

export async function fetchTeacherPerformanceWindow(args: {
  studioId: string
  teacherId: string
  startDate: Date
  endDate: Date
}) {
  const { studioId, teacherId, startDate, endDate } = args

  const [sessions, bookings] = await Promise.all([
    db.classSession.findMany({
      where: {
        studioId,
        teacherId,
        startTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        startTime: true,
        capacity: true,
        classType: {
          select: {
            name: true,
          },
        },
        bookings: {
          select: {
            status: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        studioId,
        classSession: {
          teacherId,
          studioId,
          startTime: {
            gte: startDate,
            lt: endDate,
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
            classType: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    }),
  ])

  return { sessions, bookings }
}

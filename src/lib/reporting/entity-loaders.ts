import { db } from "@/lib/db"
import { buildClassTypeEntityStats } from "@/lib/reporting/class-type-entity"
import { buildClientEntityStats, mapClientCommunications } from "@/lib/reporting/client-entity"
import { buildLocationEntityStats } from "@/lib/reporting/location-entity"
import { buildTeacherEntityReportSummary } from "@/lib/reporting/teacher-entity"

export async function loadTeacherEntityReport(args: {
  studioId: string
  teacherId: string
  startDate: Date
  endDate: Date
  includeScheduleClasses?: boolean
}) {
  const teacher = await db.teacher.findFirst({
    where: {
      id: args.teacherId,
      studioId: args.studioId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      classSessions: {
        where: {
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: "asc" },
        take: 5,
        include: {
          classType: { select: { name: true } },
          location: { select: { name: true } },
          _count: { select: { bookings: true } },
        },
      },
      _count: {
        select: { classSessions: true },
      },
    },
  })

  if (!teacher) {
    return null
  }

  const monthlyWindowStart = new Date(args.endDate)
  monthlyWindowStart.setMonth(monthlyWindowStart.getMonth() - 2)
  monthlyWindowStart.setDate(1)
  monthlyWindowStart.setHours(0, 0, 0, 0)

  const monthlyWindowEnd = new Date(args.endDate)
  monthlyWindowEnd.setMonth(monthlyWindowEnd.getMonth() + 4)
  monthlyWindowEnd.setDate(1)
  monthlyWindowEnd.setHours(0, 0, 0, 0)

  const [reportClassSessions, reportBookings, monthlyClassSessions, scheduleClasses] = await Promise.all([
    db.classSession.findMany({
      where: {
        teacherId: teacher.id,
        studioId: args.studioId,
        startTime: {
          gte: args.startDate,
          lte: args.endDate,
        },
      },
      include: {
        classType: { select: { name: true } },
        location: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    db.booking.findMany({
      where: {
        studioId: args.studioId,
        classSession: {
          teacherId: teacher.id,
          startTime: {
            gte: args.startDate,
            lte: args.endDate,
          },
        },
      },
      include: {
        classSession: {
          include: {
            classType: { select: { name: true, price: true } },
            location: { select: { name: true } },
          },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.classSession.findMany({
      where: {
        teacherId: teacher.id,
        studioId: args.studioId,
        startTime: {
          gte: monthlyWindowStart,
          lt: monthlyWindowEnd,
        },
      },
      select: {
        startTime: true,
        classType: { select: { name: true, price: true } },
        location: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
    }),
    args.includeScheduleClasses
      ? db.classSession.findMany({
          where: {
            teacherId: teacher.id,
            studioId: args.studioId,
          },
          include: {
            classType: { select: { name: true } },
            location: { select: { name: true } },
            _count: { select: { bookings: true } },
          },
          orderBy: { startTime: "desc" },
        })
      : Promise.resolve(undefined),
  ])

  const { stats, extendedStats } = buildTeacherEntityReportSummary({
    reportClassSessions,
    reportBookings,
    allClassSessions: monthlyClassSessions,
    endDate: args.endDate,
  })

  return {
    teacher,
    upcomingClasses: teacher.classSessions,
    scheduleClasses,
    stats,
    extendedStats,
  }
}

export async function loadClientEntityReport(args: {
  studioId: string
  clientId: string
  startDate: Date
  endDate: Date
}) {
  const client = await db.client.findFirst({
    where: {
      id: args.clientId,
      studioId: args.studioId,
    },
  })

  if (!client) {
    return null
  }

  const [recentBookings, reportBookings, messages] = await Promise.all([
    db.booking.findMany({
      where: {
        clientId: client.id,
        studioId: args.studioId,
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.booking.findMany({
      where: {
        clientId: client.id,
        studioId: args.studioId,
        classSession: {
          startTime: {
            gte: args.startDate,
            lte: args.endDate,
          },
        },
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.message.findMany({
      where: {
        studioId: args.studioId,
        clientId: client.id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        channel: true,
        direction: true,
        subject: true,
        body: true,
        createdAt: true,
      },
    }),
  ])

  const communications = mapClientCommunications(messages)
  const stats = buildClientEntityStats({
    reportBookings,
    endDate: args.endDate,
    credits: client.credits,
  })

  return {
    client,
    bookings: recentBookings,
    stats,
    communications,
  }
}

export async function loadClassTypeEntityReport(args: {
  studioId: string
  classTypeId: string
  startDate: Date
  endDate: Date
}) {
  const classType = await db.classType.findFirst({
    where: {
      id: args.classTypeId,
      studioId: args.studioId,
    },
  })

  if (!classType) {
    return null
  }

  const classSessions = await db.classSession.findMany({
    where: {
      studioId: args.studioId,
      classTypeId: args.classTypeId,
      startTime: {
        gte: args.startDate,
        lte: args.endDate,
      },
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      location: {
        select: { name: true },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { startTime: "desc" },
  })

  const bookings = await db.booking.findMany({
    where: {
      studioId: args.studioId,
      classSession: {
        classTypeId: args.classTypeId,
        startTime: {
          gte: args.startDate,
          lte: args.endDate,
        },
      },
    },
    include: {
      classSession: {
        include: {
          location: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = buildClassTypeEntityStats({
    classSessions,
    bookings,
    classPrice: classType.price,
    endDate: args.endDate,
  })

  return {
    classType,
    stats,
    locationIds: Array.from(new Set(classSessions.map((session) => session.locationId))),
    teacherIds: Array.from(new Set(classSessions.map((session) => session.teacherId))),
  }
}

export async function loadLocationEntityReport(args: {
  studioId: string
  locationId: string
  startDate: Date
  endDate: Date
}) {
  const location = await db.location.findFirst({
    where: {
      id: args.locationId,
      studioId: args.studioId,
    },
  })

  if (!location) {
    return null
  }

  const classSessions = await db.classSession.findMany({
    where: {
      studioId: args.studioId,
      locationId: args.locationId,
      startTime: {
        gte: args.startDate,
        lte: args.endDate,
      },
    },
    include: {
      classType: { select: { name: true } },
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { startTime: "desc" },
  })

  const bookings = await db.booking.findMany({
    where: {
      studioId: args.studioId,
      classSession: {
        locationId: args.locationId,
        startTime: {
          gte: args.startDate,
          lte: args.endDate,
        },
      },
    },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
          isActive: true,
        },
      },
      classSession: {
        include: {
          classType: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = buildLocationEntityStats({
    classSessions,
    bookings,
    endDate: args.endDate,
  })

  return {
    location,
    stats,
  }
}

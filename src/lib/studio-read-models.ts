import { db } from "@/lib/db"

type ScheduleFilterOptions = {
  studioId: string
  startDate: string | null
  endDate: string | null
  recurringGroupId: string | null
  futureOnly: boolean
  applyGlobalFutureOnly: boolean
  referenceNow?: Date
}

export function buildStudioScheduleWhere(options: ScheduleFilterOptions) {
  const {
    studioId,
    startDate,
    endDate,
    recurringGroupId,
    futureOnly,
    applyGlobalFutureOnly,
    referenceNow = new Date(),
  } = options

  const whereClause: {
    studioId: string
    startTime?: { gte?: Date; lte?: Date }
    recurringGroupId?: string
  } = { studioId }

  if (recurringGroupId) {
    whereClause.recurringGroupId = recurringGroupId
    if (futureOnly) {
      whereClause.startTime = { gte: referenceNow }
    }
    return whereClause
  }

  if (startDate || endDate) {
    whereClause.startTime = {}
    if (startDate) whereClause.startTime.gte = new Date(startDate)
    if (endDate) whereClause.startTime.lte = new Date(endDate)
    return whereClause
  }

  if (applyGlobalFutureOnly && futureOnly) {
    whereClause.startTime = { gte: referenceNow }
  }

  return whereClause
}

export function fetchStudioScheduleClasses(whereClause: {
  studioId: string
  startTime?: { gte?: Date; lte?: Date }
  recurringGroupId?: string
}) {
  return db.classSession.findMany({
    where: whereClause,
    include: {
      classType: true,
      teacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      location: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { startTime: "asc" },
  })
}

export function fetchStudioBlockedTimes(args: {
  studioId: string
  start: string | null
  end: string | null
  teacherId: string | null
}) {
  const { studioId, start, end, teacherId } = args

  const where: {
    teacher: { studioId: string }
    teacherId?: string
    OR?: Array<{
      startTime?: { gte?: Date; lte?: Date }
      endTime?: { gte?: Date; lte?: Date }
      AND?: Array<{ startTime?: { lte: Date }; endTime?: { gte: Date } }>
    }>
  } = {
    teacher: { studioId },
  }

  if (teacherId) {
    where.teacherId = teacherId
  }

  if (start && end) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    where.OR = [
      { startTime: { gte: startDate, lte: endDate } },
      { endTime: { gte: startDate, lte: endDate } },
      { AND: [{ startTime: { lte: startDate } }, { endTime: { gte: endDate } }] },
    ]
  }

  return db.teacherBlockedTime.findMany({
    where,
    include: {
      teacher: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  })
}

export function fetchStudioBrandingSummary(studioId: string) {
  return db.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      primaryColor: true,
      stripeCurrency: true,
    },
  })
}

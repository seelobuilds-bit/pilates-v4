import { isAttendedBookingStatus } from "./attendance"
import { ratioPercentage, roundCurrency } from "./metrics"
import { resolveBookingRevenue } from "./revenue"
import { buildRepeatClientRetentionFromValues } from "./teacher-metrics"

type InstructorSessionLike = {
  teacherId: string
  capacity: number
  bookings: Array<{
    status: string
    clientId: string
    paidAmount: number | null
  }>
  classType: {
    price: number | null
  }
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
}

type TeacherLike = {
  id: string
  isActive: boolean
  specialties: string[]
  user: {
    firstName: string
    lastName: string
  }
}

type InstructorRow = {
  id: string
  name: string
  classes: number
  avgFill: number
  revenue: number
  rating: number | null
  retention: number
  trend: "up" | "down" | "stable"
  specialties: string[]
}

type PreviousClassCountRow = {
  teacherId: string
  _count: unknown
}

export function buildPreviousClassCountByTeacherId(rows: PreviousClassCountRow[]) {
  return new Map(
    rows.map((row) => {
      const count =
        typeof row._count === "object" &&
        row._count !== null &&
        "teacherId" in row._count &&
        typeof (row._count as { teacherId?: unknown }).teacherId === "number"
          ? (row._count as { teacherId: number }).teacherId
          : 0
      return [row.teacherId, count] as const
    })
  )
}

export function buildInstructorRows({
  classSessions,
  studioTeachers,
  previousClassCountByTeacherId,
}: {
  classSessions: InstructorSessionLike[]
  studioTeachers: TeacherLike[]
  previousClassCountByTeacherId: Map<string, number>
}): InstructorRow[] {
  const teacherMetaById = new Map(
    studioTeachers.map((teacher) => [
      teacher.id,
      {
        specialties: teacher.specialties,
      },
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
      clientVisits: string[]
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
        clientVisits: [],
      }

    bucket.classes += 1
    bucket.totalCapacity += session.capacity

    for (const booking of session.bookings) {
      if (booking.status !== "CANCELLED") {
        bucket.revenue += resolveBookingRevenue(booking.paidAmount, session.classType.price)
      }
      if (!isAttendedBookingStatus(booking.status)) continue
      bucket.attended += 1
      bucket.clientVisits.push(booking.clientId)
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
      clientVisits: [],
    })
  }

  return Array.from(instructorBuckets.values())
    .map((bucket) => {
      const avgFill = ratioPercentage(bucket.attended, bucket.totalCapacity, 0)
      const retention = buildRepeatClientRetentionFromValues(bucket.clientVisits, 1)
      const trend =
        bucket.classes > bucket.previousClasses
          ? ("up" as const)
          : bucket.classes < bucket.previousClasses
            ? ("down" as const)
            : ("stable" as const)

      return {
        id: bucket.id,
        name: bucket.name,
        classes: bucket.classes,
        avgFill,
        revenue: roundCurrency(bucket.revenue),
        rating: bucket.rating,
        retention,
        trend,
        specialties: bucket.specialties,
      }
    })
    .sort((a, b) => b.classes - a.classes || a.name.localeCompare(b.name))
}

import { NextResponse } from "next/server"
import { TimeOffRequestStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

function toUtcDayRange(startDate: Date, endDate: Date) {
  const start = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  )
  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      23,
      59,
      59,
      999
    )
  )
  return { start, end }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

  const modules = await getStudioModuleAccess(auth.studioId)
  if (!modules.employeesEnabled) {
    return NextResponse.json({ error: "Employees module is disabled for this studio" }, { status: 403 })
  }

  try {
    const { id } = await params

    const requestRow = await db.timeOffRequest.findFirst({
      where: {
        id,
        studioId: auth.studioId,
      },
      select: {
        id: true,
        teacherId: true,
        startDate: true,
        endDate: true,
        status: true,
        type: true,
        isHalfDayStart: true,
        isHalfDayEnd: true,
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    if (!requestRow) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 })
    }

    if (requestRow.status !== TimeOffRequestStatus.PENDING) {
      return NextResponse.json({ error: "Only pending requests can be reassigned" }, { status: 409 })
    }

    const { start, end } = toUtcDayRange(requestRow.startDate, requestRow.endDate)

    const [classes, teachers] = await Promise.all([
      db.classSession.findMany({
        where: {
          studioId: auth.studioId,
          teacherId: requestRow.teacherId,
          startTime: { gte: start, lte: end },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          classType: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          teacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      db.teacher.findMany({
        where: {
          studioId: auth.studioId,
          isActive: true,
          id: { not: requestRow.teacherId },
        },
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
      }),
    ])

    return NextResponse.json({
      request: {
        ...requestRow,
        teacherName: `${requestRow.teacher.user.firstName} ${requestRow.teacher.user.lastName}`,
      },
      classes: classes.map((item) => ({
        id: item.id,
        startTime: item.startTime,
        endTime: item.endTime,
        classTypeId: item.classType.id,
        classTypeName: item.classType.name,
        locationId: item.location.id,
        locationName: item.location.name,
        currentTeacherId: item.teacher.id,
        currentTeacherName: `${item.teacher.user.firstName} ${item.teacher.user.lastName}`,
      })),
      teachers: teachers.map((item) => ({
        id: item.id,
        name: `${item.user.firstName} ${item.user.lastName}`,
        email: item.user.email,
      })),
    })
  } catch (error) {
    console.error("Failed to load affected classes for time-off request:", error)
    return NextResponse.json({ error: "Failed to load affected classes" }, { status: 500 })
  }
}

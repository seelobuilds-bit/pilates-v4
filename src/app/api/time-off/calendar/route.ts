import { NextRequest, NextResponse } from "next/server"
import { TimeOffRequestStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getStudioModuleAccess } from "@/modules/employees/module-access"
import { calculateRequestedDays } from "@/modules/employees/time-off/calculations"

function monthRange(month: string | null) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    return { start, end }
  }

  const [yearRaw, monthRaw] = month.split("-")
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  const start = new Date(Date.UTC(year, monthIndex, 1))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999))
  return { start, end }
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const modules = await getStudioModuleAccess(session.user.studioId)
  if (!modules.employeesEnabled) {
    return NextResponse.json({ error: "Employees module is disabled for this studio" }, { status: 403 })
  }

  const range = monthRange(request.nextUrl.searchParams.get("month"))

  try {
    const [teachers, requests] = await Promise.all([
      db.teacher.findMany({
        where: { studioId: session.user.studioId },
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
      }),
      db.timeOffRequest.findMany({
        where: {
          studioId: session.user.studioId,
          status: {
            in: [TimeOffRequestStatus.PENDING, TimeOffRequestStatus.APPROVED],
          },
          startDate: { lte: range.end },
          endDate: { gte: range.start },
        },
        include: {
          teacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      }),
    ])

    const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]))
    const grouped = teachers.map((teacher) => ({
      teacherId: teacher.id,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      requests: [] as Array<{
        id: string
        type: string
        status: string
        startDate: Date
        endDate: Date
        durationDays: number
      }>,
    }))

    const rowByTeacherId = new Map(grouped.map((row) => [row.teacherId, row]))

    for (const requestItem of requests) {
      if (!teachersById.has(requestItem.teacherId)) continue
      const row = rowByTeacherId.get(requestItem.teacherId)
      if (!row) continue

      row.requests.push({
        id: requestItem.id,
        type: requestItem.type,
        status: requestItem.status,
        startDate: requestItem.startDate,
        endDate: requestItem.endDate,
        durationDays: calculateRequestedDays(
          requestItem.startDate,
          requestItem.endDate,
          requestItem.isHalfDayStart,
          requestItem.isHalfDayEnd
        ),
      })
    }

    return NextResponse.json({
      start: range.start,
      end: range.end,
      rows: grouped,
    })
  } catch (error) {
    console.error("Failed to load time-off calendar:", error)
    return NextResponse.json({ error: "Failed to load time-off calendar" }, { status: 500 })
  }
}

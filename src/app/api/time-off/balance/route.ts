import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getStudioModuleAccess } from "@/modules/employees/module-access"
import { recalculateTeacherTimeOffBalance } from "@/modules/employees/time-off/balance"
import { getEffectiveTimeOffPolicy } from "@/modules/employees/time-off/policy"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const modules = await getStudioModuleAccess(session.user.studioId)
  if (!modules.employeesEnabled) {
    return NextResponse.json({ error: "Employees module is disabled for this studio" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const requestedTeacherId = searchParams.get("teacherId")
  const requestedYear = Number(searchParams.get("year") || new Date().getUTCFullYear())
  const year = Number.isFinite(requestedYear) ? requestedYear : new Date().getUTCFullYear()

  let teacherId = requestedTeacherId || null

  if (session.user.role === "TEACHER") {
    if (!session.user.teacherId) {
      return NextResponse.json({ error: "Teacher profile missing" }, { status: 400 })
    }
    teacherId = session.user.teacherId
  }

  if (!teacherId) {
    return NextResponse.json({ error: "teacherId is required" }, { status: 400 })
  }

  const teacher = await db.teacher.findFirst({
    where: {
      id: teacherId,
      studioId: session.user.studioId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  }

  try {
    const [balance, policy] = await Promise.all([
      recalculateTeacherTimeOffBalance({
        studioId: session.user.studioId,
        teacherId,
        year,
      }),
      getEffectiveTimeOffPolicy(session.user.studioId),
    ])

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        engagementType: teacher.engagementType,
      },
      policy,
      balance: {
        ...balance,
        annualLeaveRemainingDays: Number((balance.annualLeaveEntitledDays - balance.annualLeaveUsedDays).toFixed(2)),
        sickPaidRemainingDays: Number((balance.sickPaidEntitledDays - balance.sickPaidUsedDays).toFixed(2)),
      },
    })
  } catch (error) {
    console.error("Failed to load time-off balance:", error)
    return NextResponse.json({ error: "Failed to load time-off balance" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const modules = await getStudioModuleAccess(session.user.studioId)
    if (session.user.role !== "TEACHER" || !session.user.teacherId) {
      return NextResponse.json(modules)
    }

    const teacher = await db.teacher.findFirst({
      where: {
        id: session.user.teacherId,
        studioId: session.user.studioId,
      },
      select: {
        engagementType: true,
      },
    })

    const isTeacherEmployee = teacher?.engagementType === "EMPLOYEE"

    return NextResponse.json({
      ...modules,
      teacherEngagementType: teacher?.engagementType ?? null,
      isTeacherEmployee,
      canAccessTeacherInvoices: modules.invoicesEnabled && !isTeacherEmployee,
    })
  } catch (error) {
    console.error("Failed to fetch module access:", error)
    return NextResponse.json({ error: "Failed to fetch module access" }, { status: 500 })
  }
}

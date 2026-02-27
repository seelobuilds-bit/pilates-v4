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
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      select: {
        name: true,
        logoUrl: true,
        logoScale: true,
      },
    })

    if (session.user.role !== "TEACHER" || !session.user.teacherId) {
      return NextResponse.json({
        ...modules,
        studioName: studio?.name ?? session.user.studioName ?? null,
        studioLogoUrl: studio?.logoUrl ?? null,
        studioLogoScale: typeof studio?.logoScale === "number" ? studio.logoScale : 100,
      })
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
      studioName: studio?.name ?? session.user.studioName ?? null,
      studioLogoUrl: studio?.logoUrl ?? null,
      studioLogoScale: typeof studio?.logoScale === "number" ? studio.logoScale : 100,
      teacherEngagementType: teacher?.engagementType ?? null,
      isTeacherEmployee,
      canAccessTeacherInvoices: modules.invoicesEnabled && !isTeacherEmployee,
    })
  } catch (error) {
    console.error("Failed to fetch module access:", error)
    return NextResponse.json({ error: "Failed to fetch module access" }, { status: 500 })
  }
}

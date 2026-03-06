import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getDemoStudioContext } from "@/lib/demo-studio"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const modules = await getStudioModuleAccess(session.user.studioId)
    const demoStudioContext = session.user.isDemoSession ? await getDemoStudioContext() : null
    const studioLookupId = demoStudioContext?.studioId ?? session.user.studioId
    const studio = await db.studio.findUnique({
      where: { id: studioLookupId },
      select: {
        name: true,
        logoUrl: true,
        logoScale: true,
      },
    })

    const currentUserFirstName = session.user.isDemoSession
      ? demoStudioContext?.ownerFirstName || "Demo"
      : session.user.firstName ?? ""
    const currentUserLastName = session.user.isDemoSession
      ? demoStudioContext?.ownerLastName || ""
      : session.user.lastName ?? ""
    const currentUserEmail = session.user.isDemoSession
      ? demoStudioContext?.ownerEmail || "demo@thecurrent.app"
      : session.user.email ?? null
    const currentUserDisplayName = session.user.isDemoSession
      ? "Demo"
      : `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim()
    const studioName = session.user.isDemoSession
      ? studio?.name ?? demoStudioContext?.studioName ?? session.user.studioName ?? null
      : studio?.name ?? session.user.studioName ?? null

    if (session.user.role !== "TEACHER" || !session.user.teacherId) {
      return NextResponse.json({
        ...modules,
        studioName,
        studioLogoUrl: studio?.logoUrl ?? null,
        studioLogoScale: typeof studio?.logoScale === "number" ? studio.logoScale : 100,
        currentUserFirstName,
        currentUserLastName,
        currentUserEmail,
        currentUserDisplayName,
        isDemoSession: Boolean(session.user.isDemoSession),
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
      studioName,
      studioLogoUrl: studio?.logoUrl ?? null,
      studioLogoScale: typeof studio?.logoScale === "number" ? studio.logoScale : 100,
      currentUserFirstName,
      currentUserLastName,
      currentUserEmail,
      currentUserDisplayName,
      isDemoSession: Boolean(session.user.isDemoSession),
      teacherEngagementType: teacher?.engagementType ?? null,
      isTeacherEmployee,
      canAccessTeacherInvoices: modules.invoicesEnabled && !isTeacherEmployee,
    })
  } catch (error) {
    console.error("Failed to fetch module access:", error)
    return NextResponse.json({ error: "Failed to fetch module access" }, { status: 500 })
  }
}

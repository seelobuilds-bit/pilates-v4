import { db } from "@/lib/db"
import { getDemoStudioContext } from "@/lib/demo-studio"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

export type StudioScopedSessionUser = {
  role?: string | null
  studioId?: string | null
  teacherId?: string | null
  studioName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  isDemoSession?: boolean
}

export type StudioShellContext = {
  primaryColor: string | null
  invoicesEnabled: boolean
  employeesEnabled: boolean
  timeOffEnabled: boolean
  isTeacherEmployee: boolean
  canAccessTeacherInvoices: boolean
  studioName: string | null
  studioLogoUrl: string | null
  studioLogoScale: number
  currentUserFirstName: string | null
  currentUserLastName: string | null
  currentUserEmail: string | null
  currentUserDisplayName: string | null
  isDemoSession: boolean
}

const DEFAULT_CONTEXT: StudioShellContext = {
  primaryColor: null,
  invoicesEnabled: true,
  employeesEnabled: false,
  timeOffEnabled: true,
  isTeacherEmployee: false,
  canAccessTeacherInvoices: true,
  studioName: null,
  studioLogoUrl: null,
  studioLogoScale: 100,
  currentUserFirstName: null,
  currentUserLastName: null,
  currentUserEmail: null,
  currentUserDisplayName: null,
  isDemoSession: false,
}

export async function getStudioShellContext(
  user: StudioScopedSessionUser | null | undefined
): Promise<StudioShellContext> {
  if (!user?.studioId || (user.role !== "OWNER" && user.role !== "TEACHER")) {
    return DEFAULT_CONTEXT
  }

  const [modules, demoStudioContext] = await Promise.all([
    getStudioModuleAccess(user.studioId),
    user.isDemoSession ? getDemoStudioContext() : Promise.resolve(null),
  ])

  const studioLookupId = demoStudioContext?.studioId ?? user.studioId

  const [studio, teacher] = await Promise.all([
    db.studio.findUnique({
      where: { id: studioLookupId },
      select: {
        name: true,
        logoUrl: true,
        logoScale: true,
        primaryColor: true,
      },
    }),
    user.role === "TEACHER" && user.teacherId
      ? db.teacher.findFirst({
          where: {
            id: user.teacherId,
            studioId: user.studioId,
          },
          select: {
            engagementType: true,
          },
        })
      : Promise.resolve(null),
  ])

  const isTeacherEmployee = teacher?.engagementType === "EMPLOYEE"
  const currentUserFirstName = user.isDemoSession ? demoStudioContext?.ownerFirstName || "Demo" : user.firstName ?? null
  const currentUserLastName = user.isDemoSession ? demoStudioContext?.ownerLastName || null : user.lastName ?? null
  const currentUserEmail = user.isDemoSession
    ? demoStudioContext?.ownerEmail || "demo@thecurrent.app"
    : user.email ?? null
  const currentUserDisplayName = user.isDemoSession
    ? "Demo"
    : `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null

  return {
    primaryColor: studio?.primaryColor || null,
    invoicesEnabled: modules.invoicesEnabled,
    employeesEnabled: modules.employeesEnabled,
    timeOffEnabled: modules.timeOffEnabled,
    isTeacherEmployee,
    canAccessTeacherInvoices: modules.invoicesEnabled && !isTeacherEmployee,
    studioName: user.isDemoSession ? studio?.name ?? demoStudioContext?.studioName ?? user.studioName ?? null : studio?.name ?? user.studioName ?? null,
    studioLogoUrl: studio?.logoUrl ?? null,
    studioLogoScale: typeof studio?.logoScale === "number" ? studio.logoScale : 100,
    currentUserFirstName,
    currentUserLastName,
    currentUserEmail,
    currentUserDisplayName,
    isDemoSession: Boolean(user.isDemoSession),
  }
}

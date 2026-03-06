import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getSession } from "@/lib/session"
import { Sidebar } from "@/components/layout/sidebar"
import { SupportWidget } from "@/components/support/support-widget"
import { buildStudioBrandCssVariables } from "@/lib/brand-color"
import { DEMO_THEME_PRIMARY_COLOR_COOKIE, resolveDemoThemePrimaryColor } from "@/lib/demo-theme"
import { getStudioShellContext } from "@/lib/studio-shell-context"
import type { CSSProperties } from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const isStudioScopedRole = session.user.role === "OWNER" || session.user.role === "TEACHER"
  const studioShellContext = isStudioScopedRole ? await getStudioShellContext(session.user) : null
  let studioPrimaryColor: string | null = studioShellContext?.primaryColor ?? null

  if (session.user.isDemoSession) {
    const cookieStore = await cookies()
    const demoThemePrimaryColor = resolveDemoThemePrimaryColor(
      cookieStore.get(DEMO_THEME_PRIMARY_COLOR_COOKIE)?.value
    )
    if (demoThemePrimaryColor) {
      studioPrimaryColor = demoThemePrimaryColor
    }
  }

  const brandVariables = isStudioScopedRole
    ? (buildStudioBrandCssVariables(studioPrimaryColor) as CSSProperties)
    : undefined

  return (
    <div
      className={`app-ui-scope flex h-dvh min-h-screen overflow-x-hidden bg-gray-50 ${isStudioScopedRole ? "studio-brand-scope" : ""}`}
      style={brandVariables}
    >
      <Sidebar initialModuleAccess={studioShellContext ?? undefined} />
      <main className="app-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
      <SupportWidget />
    </div>
  )
}

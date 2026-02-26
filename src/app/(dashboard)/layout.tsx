import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Sidebar } from "@/components/layout/sidebar"
import { SupportWidget } from "@/components/support/support-widget"
import { db } from "@/lib/db"
import { buildStudioBrandCssVariables } from "@/lib/brand-color"
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
  let studioPrimaryColor: string | null = null

  if (isStudioScopedRole && session.user.studioId) {
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      select: { primaryColor: true },
    })
    studioPrimaryColor = studio?.primaryColor || null
  }

  const brandVariables = isStudioScopedRole
    ? (buildStudioBrandCssVariables(studioPrimaryColor) as CSSProperties)
    : undefined

  return (
    <div
      className={`flex h-dvh min-h-screen overflow-x-hidden bg-gray-50 ${isStudioScopedRole ? "studio-brand-scope" : ""}`}
      style={brandVariables}
    >
      <Sidebar />
      <main className="app-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
      <SupportWidget />
    </div>
  )
}

import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Sidebar } from "@/components/layout/sidebar"
import { SupportWidget } from "@/components/support/support-widget"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex h-dvh min-h-screen overflow-x-hidden bg-gray-50">
      <Sidebar />
      <main className="app-scrollbar min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
      <SupportWidget />
    </div>
  )
}

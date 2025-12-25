import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "SALES_AGENT") {
    redirect("/login")
  }

  return <>{children}</>
}

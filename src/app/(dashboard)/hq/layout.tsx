import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function HQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    redirect("/login")
  }

  return <>{children}</>
}

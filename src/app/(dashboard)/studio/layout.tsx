import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/login")
  }

  return <>{children}</>
}




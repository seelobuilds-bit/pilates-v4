"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login")
  }

  return <>{children}</>
}












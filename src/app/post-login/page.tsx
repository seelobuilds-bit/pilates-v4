import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function PostLoginPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "HQ_ADMIN") {
    redirect("/hq")
  }

  if (session.user.role === "SALES_AGENT") {
    redirect("/sales")
  }

  if (session.user.role === "OWNER") {
    redirect("/studio")
  }

  if (session.user.role === "TEACHER") {
    redirect("/teacher")
  }

  redirect("/")
}

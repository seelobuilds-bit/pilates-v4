import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const modules = await getStudioModuleAccess(session.user.studioId)
    return NextResponse.json(modules)
  } catch (error) {
    console.error("Failed to fetch module access:", error)
    return NextResponse.json({ error: "Failed to fetch module access" }, { status: 500 })
  }
}

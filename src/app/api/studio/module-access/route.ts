import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getStudioShellContext } from "@/lib/studio-shell-context"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const shellContext = await getStudioShellContext(session.user)
    return NextResponse.json(shellContext)
  } catch (error) {
    console.error("Failed to fetch module access:", error)
    return NextResponse.json({ error: "Failed to fetch module access" }, { status: 500 })
  }
}

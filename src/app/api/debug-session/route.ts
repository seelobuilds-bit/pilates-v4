import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    hasSession: !!session,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      studioId: session.user.studioId,
      studioName: session.user.studioName,
    } : null
  })
}

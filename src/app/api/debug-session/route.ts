import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  
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

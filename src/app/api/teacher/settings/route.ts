import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { bio, specialties } = body

    await db.teacher.update({
      where: { id: session.user.teacherId },
      data: {
        bio,
        specialties
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update teacher settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}


























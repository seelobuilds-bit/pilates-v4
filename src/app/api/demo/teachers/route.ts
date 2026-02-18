import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET() {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const teachers = await db.teacher.findMany({
    where: { studioId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(teachers)
}

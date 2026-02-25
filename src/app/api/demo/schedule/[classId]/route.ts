import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const studioId = await getDemoStudioId()
  const { classId } = await params

  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const classSession = await db.classSession.findFirst({
    where: {
      id: classId,
      studioId,
    },
    include: {
      classType: true,
      teacher: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
      location: true,
      bookings: {
        where: { status: "CONFIRMED" },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
      _count: { select: { bookings: true } },
    },
  })

  if (!classSession) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  return NextResponse.json(classSession)
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

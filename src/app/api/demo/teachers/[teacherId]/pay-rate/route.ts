import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ type: "PER_CLASS", rate: 0, currency: "USD", classTypeRates: null })
  }

  const { teacherId } = await params

  const teacher = await db.teacher.findFirst({
    where: { id: teacherId, studioId }
  })

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  }

  const payRate = await db.teacherPayRate.findUnique({ where: { teacherId } })

  return NextResponse.json(
    payRate || {
      type: "PER_CLASS",
      rate: 0,
      currency: "USD",
      classTypeRates: null
    }
  )
}

export async function PUT() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

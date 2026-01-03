import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch teacher's pay rate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getSession()
  const { teacherId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify teacher belongs to this studio
    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const payRate = await db.teacherPayRate.findUnique({
      where: { teacherId }
    })

    return NextResponse.json(payRate || {
      type: "PER_CLASS",
      rate: 0,
      currency: "USD",
      classTypeRates: null
    })
  } catch (error) {
    console.error("Failed to fetch pay rate:", error)
    return NextResponse.json({ error: "Failed to fetch pay rate" }, { status: 500 })
  }
}

// PUT - Update or create pay rate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getSession()
  const { teacherId } = await params

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify teacher belongs to this studio
    const teacher = await db.teacher.findFirst({
      where: {
        id: teacherId,
        studioId: session.user.studioId
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const body = await request.json()
    const { type, rate, currency, classTypeRates } = body

    const payRate = await db.teacherPayRate.upsert({
      where: { teacherId },
      update: {
        type,
        rate,
        currency,
        classTypeRates: classTypeRates ? JSON.stringify(classTypeRates) : null
      },
      create: {
        teacherId,
        type,
        rate,
        currency,
        classTypeRates: classTypeRates ? JSON.stringify(classTypeRates) : null
      }
    })

    return NextResponse.json(payRate)
  } catch (error) {
    console.error("Failed to update pay rate:", error)
    return NextResponse.json({ error: "Failed to update pay rate" }, { status: 500 })
  }
}




















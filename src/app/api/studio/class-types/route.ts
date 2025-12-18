import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classTypes = await db.classType.findMany({
    where: { studioId: session.user.studioId },
    orderBy: { name: "asc" }
  })

  return NextResponse.json(classTypes)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, duration, capacity, price } = body

    const classType = await db.classType.create({
      data: {
        name,
        description,
        duration,
        capacity,
        price,
        studioId: session.user.studioId
      }
    })

    return NextResponse.json(classType)
  } catch (error) {
    console.error("Failed to create class type:", error)
    return NextResponse.json({ error: "Failed to create class type" }, { status: 500 })
  }
}

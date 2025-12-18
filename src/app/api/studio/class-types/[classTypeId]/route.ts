import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { classTypeId } = await params
  const classType = await db.classType.findFirst({
    where: {
      id: classTypeId,
      studioId: session.user.studioId
    }
  })

  if (!classType) {
    return NextResponse.json({ error: "Class type not found" }, { status: 404 })
  }

  return NextResponse.json(classType)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { classTypeId } = await params
    const body = await request.json()
    const { name, description, duration, capacity, price, isActive } = body

    const classType = await db.classType.updateMany({
      where: {
        id: classTypeId,
        studioId: session.user.studioId
      },
      data: {
        name,
        description,
        duration,
        capacity,
        price,
        isActive
      }
    })

    if (classType.count === 0) {
      return NextResponse.json({ error: "Class type not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update class type:", error)
    return NextResponse.json({ error: "Failed to update class type" }, { status: 500 })
  }
}

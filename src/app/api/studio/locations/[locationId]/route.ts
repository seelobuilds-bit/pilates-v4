import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { locationId } = await params
  const location = await db.location.findFirst({
    where: {
      id: locationId,
      studioId: session.user.studioId
    }
  })

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 })
  }

  return NextResponse.json(location)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { locationId } = await params
    const body = await request.json()
    const { name, address, city, state, zipCode, isActive } = body

    const location = await db.location.updateMany({
      where: {
        id: locationId,
        studioId: session.user.studioId
      },
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        isActive
      }
    })

    if (location.count === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

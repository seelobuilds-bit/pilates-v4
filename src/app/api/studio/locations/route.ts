import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const locations = await db.location.findMany({
    where: { studioId: session.user.studioId },
    orderBy: { name: "asc" }
  })

  return NextResponse.json(locations)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, address, city, state, zipCode, phone } = body

    const location = await db.location.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        studioId: session.user.studioId
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Failed to create location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"
import { fetchStudioClassTypes } from "@/lib/studio-directory-query"

export async function GET() {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

  const classTypes = await fetchStudioClassTypes(auth.studioId)

  return NextResponse.json(classTypes)
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

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
        studioId: auth.studioId
      }
    })

    return NextResponse.json(classType)
  } catch (error) {
    console.error("Failed to create class type:", error)
    return NextResponse.json({ error: "Failed to create class type" }, { status: 500 })
  }
}

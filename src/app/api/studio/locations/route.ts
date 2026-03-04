import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"
import { fetchStudioLocations } from "@/lib/studio-directory-query"

export async function GET() {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

  const locations = await fetchStudioLocations(auth.studioId)

  return NextResponse.json(locations)
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

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
        studioId: auth.studioId
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Failed to create location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}

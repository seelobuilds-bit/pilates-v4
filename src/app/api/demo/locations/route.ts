import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDemoStudioId } from "@/lib/demo-studio"

export async function GET() {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const locations = await db.location.findMany({
    where: { studioId },
    orderBy: { name: "asc" }
  })

  return NextResponse.json(locations)
}

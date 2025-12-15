import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const studio = await db.studio.findUnique({
      where: { subdomain: params.subdomain },
      include: {
        locations: {
          where: { isActive: true },
          orderBy: { name: "asc" }
        },
        classTypes: {
          where: { isActive: true },
          orderBy: { name: "asc" }
        },
        teachers: {
          where: { isActive: true },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: studio.id,
      name: studio.name,
      primaryColor: studio.primaryColor,
      locations: studio.locations,
      classTypes: studio.classTypes,
      teachers: studio.teachers
    })
  } catch (error) {
    console.error("Failed to fetch studio data:", error)
    return NextResponse.json({ error: "Failed to fetch studio data" }, { status: 500 })
  }
}

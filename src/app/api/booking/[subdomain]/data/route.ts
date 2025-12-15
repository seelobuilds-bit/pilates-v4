import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const studio = await db.studio.findUnique({
    where: { subdomain: params.subdomain },
    include: {
      locations: {
        where: { isActive: true },
        select: { id: true, name: true, address: true, city: true }
      },
      classTypes: {
        where: { isActive: true },
        select: { id: true, name: true, description: true, duration: true, price: true }
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
    teachers: studio.teachers.map(t => ({
      id: t.id,
      user: t.user
    }))
  })
}




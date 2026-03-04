import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOwnerEntityReportContext } from "@/lib/reporting/entity-route-context"
import { buildClassTypeEntityResponse } from "@/lib/reporting/entity-response"
import { loadClassTypeEntityReport } from "@/lib/reporting/entity-loaders"
import { getSession } from "@/lib/session"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const context = await resolveOwnerEntityReportContext(request)
  if (!context.ok) return context.response

  const { classTypeId } = await params
  const classTypeReport = await loadClassTypeEntityReport({
    studioId: context.studioId,
    classTypeId,
    startDate: context.startDate,
    endDate: context.endDate,
  })

  if (!classTypeReport) {
    return NextResponse.json({ error: "Class type not found" }, { status: 404 })
  }

  return NextResponse.json(
    buildClassTypeEntityResponse({
      classType: classTypeReport.classType,
      stats: classTypeReport.stats,
      locationIds: classTypeReport.locationIds,
      teacherIds: classTypeReport.teacherIds,
    })
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classTypeId: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
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

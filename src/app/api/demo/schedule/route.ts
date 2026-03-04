import { NextRequest, NextResponse } from "next/server"
import { getDemoStudioId } from "@/lib/demo-studio"
import { buildStudioScheduleWhere, fetchStudioScheduleClasses } from "@/lib/studio-read-models"

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json([])
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get("start")
  const endDate = searchParams.get("end")
  const recurringGroupId = searchParams.get("recurringGroupId")
  const futureOnly = searchParams.get("futureOnly") === "true"
  const whereClause = buildStudioScheduleWhere({
    studioId,
    startDate,
    endDate,
    recurringGroupId,
    futureOnly,
    applyGlobalFutureOnly: true,
  })
  const classes = await fetchStudioScheduleClasses(whereClause)

  return NextResponse.json(classes)
}

export async function POST() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function PATCH() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Demo is read-only" }, { status: 403 })
}

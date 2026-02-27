import { NextRequest, NextResponse } from "next/server"
import { TimeOffRequestStatus, TimeOffRequestType } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { calculateRequestedDays } from "@/modules/employees/time-off/calculations"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

const createRequestSchema = z.object({
  type: z.nativeEnum(TimeOffRequestType),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isHalfDayStart: z.boolean().optional().default(false),
  isHalfDayEnd: z.boolean().optional().default(false),
  reasonText: z.string().min(2).max(2000),
})

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const modules = await getStudioModuleAccess(session.user.studioId)
  if (!modules.timeOffEnabled) {
    return NextResponse.json({ error: "Time Off module is disabled for this studio" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const type = searchParams.get("type")
  const teacherId = searchParams.get("teacherId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: Record<string, unknown> = {
    studioId: session.user.studioId,
  }

  if (status && Object.values(TimeOffRequestStatus).includes(status as TimeOffRequestStatus)) {
    where.status = status
  }
  if (type && Object.values(TimeOffRequestType).includes(type as TimeOffRequestType)) {
    where.type = type
  }

  if (session.user.role === "TEACHER") {
    if (!session.user.teacherId) {
      return NextResponse.json({ error: "Teacher profile missing" }, { status: 400 })
    }
    where.teacherId = session.user.teacherId
  } else if (teacherId) {
    where.teacherId = teacherId
  }

  if (startDate || endDate) {
    where.AND = [
      ...(startDate ? [{ endDate: { gte: new Date(startDate) } }] : []),
      ...(endDate ? [{ startDate: { lte: new Date(endDate) } }] : []),
    ]
  }

  try {
    const requests = await db.timeOffRequest.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      requests.map((item) => ({
        ...item,
        durationDays: calculateRequestedDays(
          item.startDate,
          item.endDate,
          item.isHalfDayStart,
          item.isHalfDayEnd
        ),
      }))
    )
  } catch (error) {
    console.error("Failed to fetch time-off requests:", error)
    return NextResponse.json({ error: "Failed to fetch time-off requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "TEACHER" || !session.user.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const modules = await getStudioModuleAccess(session.user.studioId)
  if (!modules.timeOffEnabled) {
    return NextResponse.json({ error: "Time Off module is disabled for this studio" }, { status: 403 })
  }

  try {
    const parsed = createRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const startDate = new Date(parsed.data.startDate)
    const endDate = new Date(parsed.data.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 })
    }

    const teacher = await db.teacher.findFirst({
      where: {
        id: session.user.teacherId,
        studioId: session.user.studioId,
      },
      select: { id: true },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const created = await db.timeOffRequest.create({
      data: {
        studioId: session.user.studioId,
        teacherId: session.user.teacherId,
        type: parsed.data.type,
        startDate,
        endDate,
        isHalfDayStart: parsed.data.isHalfDayStart,
        isHalfDayEnd: parsed.data.isHalfDayEnd,
        reasonText: parsed.data.reasonText.trim(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json({
      ...created,
      durationDays: calculateRequestedDays(
        created.startDate,
        created.endDate,
        created.isHalfDayStart,
        created.isHalfDayEnd
      ),
    })
  } catch (error) {
    console.error("Failed to create time-off request:", error)
    return NextResponse.json({ error: "Failed to create time-off request" }, { status: 500 })
  }
}

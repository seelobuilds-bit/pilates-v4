import { NextRequest, NextResponse } from "next/server"
import { TimeOffRequestStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { recalculateBalancesForRequestRange } from "@/modules/employees/time-off/balance"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const modules = await getStudioModuleAccess(session.user.studioId)
  if (!modules.employeesEnabled) {
    return NextResponse.json({ error: "Employees module is disabled for this studio" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.timeOffRequest.findFirst({
      where: {
        id,
        studioId: session.user.studioId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Time-off request not found" }, { status: 404 })
    }

    if (session.user.role === "OWNER") {
      const action = typeof body.action === "string" ? body.action.toUpperCase() : ""
      const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : undefined

      if (action !== "APPROVE" && action !== "REJECT") {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }

      if (existing.status !== TimeOffRequestStatus.PENDING) {
        return NextResponse.json({ error: "Only pending requests can be updated" }, { status: 409 })
      }

      const nextStatus = action === "APPROVE" ? TimeOffRequestStatus.APPROVED : TimeOffRequestStatus.REJECTED

      const updated = await db.timeOffRequest.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          adminNotes,
          approvedByUserId: action === "APPROVE" ? session.user.id : undefined,
          approvedAt: action === "APPROVE" ? new Date() : undefined,
        },
      })

      await recalculateBalancesForRequestRange({
        studioId: updated.studioId,
        teacherId: updated.teacherId,
        startDate: updated.startDate,
        endDate: updated.endDate,
      })

      return NextResponse.json(updated)
    }

    if (!session.user.teacherId || existing.teacherId !== session.user.teacherId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const action = typeof body.action === "string" ? body.action.toUpperCase() : ""
    if (action !== "CANCEL") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (existing.status !== TimeOffRequestStatus.PENDING) {
      return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 409 })
    }

    const updated = await db.timeOffRequest.update({
      where: { id: existing.id },
      data: {
        status: TimeOffRequestStatus.CANCELLED,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update time-off request:", error)
    return NextResponse.json({ error: "Failed to update time-off request" }, { status: 500 })
  }
}

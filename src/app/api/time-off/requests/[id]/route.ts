import { NextRequest, NextResponse } from "next/server"
import { TimeOffRequestStatus } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { findClassSwapConflict } from "@/lib/class-swaps"
import { getSession } from "@/lib/session"
import { recalculateBalancesForRequestRange } from "@/modules/employees/time-off/balance"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

const ownerUpdateSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  adminNotes: z.string().optional(),
  reassignments: z
    .array(
      z.object({
        classSessionId: z.string().min(1),
        toTeacherId: z.string().min(1),
      })
    )
    .max(500)
    .optional()
    .default([]),
})

function toUtcDayRange(startDate: Date, endDate: Date) {
  const start = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  )
  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      23,
      59,
      59,
      999
    )
  )
  return { start, end }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()

  if (!session?.user?.studioId || (session.user.role !== "OWNER" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const modules = await getStudioModuleAccess(session.user.studioId)
  if (!modules.timeOffEnabled) {
    return NextResponse.json({ error: "Time Off module is disabled for this studio" }, { status: 403 })
  }
  const studioId = session.user.studioId

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
      const parsed = ownerUpdateSchema.safeParse({
        action: typeof body.action === "string" ? body.action.toUpperCase() : "",
        adminNotes: typeof body.adminNotes === "string" ? body.adminNotes.trim() : undefined,
        reassignments: Array.isArray(body.reassignments) ? body.reassignments : [],
      })
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid request payload", details: parsed.error.flatten() },
          { status: 400 }
        )
      }
      const { action, adminNotes, reassignments } = parsed.data

      if (existing.status !== TimeOffRequestStatus.PENDING) {
        return NextResponse.json({ error: "Only pending requests can be updated" }, { status: 409 })
      }

      const nextStatus = action === "APPROVE" ? TimeOffRequestStatus.APPROVED : TimeOffRequestStatus.REJECTED

      const { start, end } = toUtcDayRange(existing.startDate, existing.endDate)
      const normalizedReassignments = reassignments.filter(
        (entry) => entry.classSessionId && entry.toTeacherId && entry.toTeacherId !== existing.teacherId
      )

      const updated = await db.$transaction(async (tx) => {
        if (action === "APPROVE" && normalizedReassignments.length > 0) {
          const classSessionIds = Array.from(
            new Set(normalizedReassignments.map((entry) => entry.classSessionId))
          )
          const targetTeacherIds = Array.from(
            new Set(normalizedReassignments.map((entry) => entry.toTeacherId))
          )

          if (classSessionIds.length !== normalizedReassignments.length) {
            throw new Error("Duplicate class session reassignment detected")
          }

          const [sessions, targetTeachers] = await Promise.all([
            tx.classSession.findMany({
              where: {
                id: { in: classSessionIds },
                studioId,
                teacherId: existing.teacherId,
                startTime: { gte: start, lte: end },
              },
              select: {
                id: true,
                startTime: true,
                endTime: true,
                classType: { select: { name: true } },
                location: { select: { name: true } },
              },
            }),
            tx.teacher.findMany({
              where: {
                id: { in: targetTeacherIds },
                studioId,
                isActive: true,
              },
              select: { id: true },
            }),
          ])

          const sessionById = new Map(
            sessions.map((item) => [
              item.id,
              {
                id: item.id,
                startTime: item.startTime,
                endTime: item.endTime,
                classTypeName: item.classType.name,
                locationName: item.location.name,
              },
            ])
          )
          const targetTeacherSet = new Set(targetTeachers.map((item) => item.id))

          if (sessions.length !== classSessionIds.length) {
            throw new Error("One or more classes cannot be reassigned for this request")
          }
          if (targetTeachers.length !== targetTeacherIds.length) {
            throw new Error("One or more target teachers are invalid or inactive")
          }

          for (const reassignment of normalizedReassignments) {
            if (!sessionById.has(reassignment.classSessionId)) {
              throw new Error("Class reassignment references an invalid class session")
            }
            if (!targetTeacherSet.has(reassignment.toTeacherId)) {
              throw new Error("Class reassignment references an invalid teacher")
            }
          }

          const sortedByTeacher = normalizedReassignments
            .map((entry) => ({
              ...entry,
              session: sessionById.get(entry.classSessionId)!,
            }))
            .sort((a, b) => {
              if (a.toTeacherId === b.toTeacherId) {
                return a.session.startTime.getTime() - b.session.startTime.getTime()
              }
              return a.toTeacherId.localeCompare(b.toTeacherId)
            })

          for (let idx = 1; idx < sortedByTeacher.length; idx += 1) {
            const previous = sortedByTeacher[idx - 1]
            const current = sortedByTeacher[idx]
            if (previous.toTeacherId !== current.toTeacherId) continue
            if (current.session.startTime < previous.session.endTime) {
              throw new Error("A reassigned teacher has overlapping classes in this time range")
            }
          }

          for (const reassignment of normalizedReassignments) {
            const sessionRow = sessionById.get(reassignment.classSessionId)!
            const conflict = await findClassSwapConflict({
              studioId,
              targetTeacherId: reassignment.toTeacherId,
              startTime: sessionRow.startTime,
              endTime: sessionRow.endTime,
              excludeClassSessionId: sessionRow.id,
            })

            if (conflict) {
              throw new Error(
                `Cannot reassign ${sessionRow.classTypeName} at ${sessionRow.locationName}: ${conflict.message}`
              )
            }
          }

          for (const reassignment of normalizedReassignments) {
            await tx.classSession.update({
              where: { id: reassignment.classSessionId },
              data: { teacherId: reassignment.toTeacherId },
            })
          }
        }

        return tx.timeOffRequest.update({
          where: { id: existing.id },
          data: {
            status: nextStatus,
            adminNotes,
            approvedByUserId: action === "APPROVE" ? session.user.id : null,
            approvedAt: action === "APPROVE" ? new Date() : null,
          },
        })
      })

      const teacher = await db.teacher.findUnique({
        where: { id: updated.teacherId },
        select: { engagementType: true },
      })

      if (teacher?.engagementType === "EMPLOYEE") {
        await recalculateBalancesForRequestRange({
          studioId: updated.studioId,
          teacherId: updated.teacherId,
          startDate: updated.startDate,
          endDate: updated.endDate,
        })
      }

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
    if (error instanceof Error) {
      const message = error.message || "Failed to update time-off request"
      if (
        message.includes("reassign") ||
        message.includes("teacher") ||
        message.includes("class") ||
        message.includes("Duplicate") ||
        message.includes("overlapping")
      ) {
        return NextResponse.json({ error: message }, { status: 409 })
      }
    }
    console.error("Failed to update time-off request:", error)
    return NextResponse.json({ error: "Failed to update time-off request" }, { status: 500 })
  }
}

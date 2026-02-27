import { NextRequest, NextResponse } from "next/server"
import { ClassSwapRequestStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { findClassSwapConflict } from "@/lib/class-swaps"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"

function normalizeStatus(status: string | null): ClassSwapRequestStatus | null {
  if (!status) return null
  if (status === ClassSwapRequestStatus.PENDING) return ClassSwapRequestStatus.PENDING
  if (status === ClassSwapRequestStatus.APPROVED) return ClassSwapRequestStatus.APPROVED
  if (status === ClassSwapRequestStatus.DECLINED) return ClassSwapRequestStatus.DECLINED
  if (status === ClassSwapRequestStatus.CANCELLED) return ClassSwapRequestStatus.CANCELLED
  return null
}

export async function GET(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

  const requestedStatus = normalizeStatus(request.nextUrl.searchParams.get("status"))
  const statusFilter = requestedStatus || ClassSwapRequestStatus.PENDING

  try {
    const requests = await db.classSwapRequest.findMany({
      where: {
        studioId: auth.studioId,
        status: statusFilter,
      },
      include: {
        classSession: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            classType: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
        fromTeacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        toTeacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Failed to fetch class swap requests:", error)
    return NextResponse.json({ error: "Failed to fetch class swap requests" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const requestId = typeof body.requestId === "string" ? body.requestId : ""
    const action = typeof body.action === "string" ? body.action : ""
    const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : ""

    if (!requestId || !["APPROVE", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    const swapRequest = await db.classSwapRequest.findFirst({
      where: {
        id: requestId,
        studioId: auth.studioId,
      },
      include: {
        classSession: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    if (!swapRequest) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 })
    }
    if (swapRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be updated" },
        { status: 409 }
      )
    }

    if (action === "DECLINE") {
      const declined = await db.classSwapRequest.update({
        where: { id: swapRequest.id },
        data: {
          status: "DECLINED",
          adminNotes: adminNotes || undefined,
          resolvedAt: new Date(),
          resolvedById: auth.userId,
        },
      })

      return NextResponse.json({ request: declined })
    }

    if (swapRequest.classSession.startTime <= new Date()) {
      return NextResponse.json(
        { error: "Cannot approve swap for a class that has already started" },
        { status: 400 }
      )
    }

    const conflict = await findClassSwapConflict({
      studioId: auth.studioId,
      targetTeacherId: swapRequest.toTeacherId,
      startTime: swapRequest.classSession.startTime,
      endTime: swapRequest.classSession.endTime,
      excludeClassSessionId: swapRequest.classSessionId,
    })

    if (conflict) {
      return NextResponse.json({ error: conflict.message, code: conflict.code }, { status: 409 })
    }

    const approved = await db.$transaction(async (tx) => {
      await tx.classSession.update({
        where: { id: swapRequest.classSessionId },
        data: { teacherId: swapRequest.toTeacherId },
      })

      return tx.classSwapRequest.update({
        where: { id: swapRequest.id },
        data: {
          status: "APPROVED",
          adminNotes: adminNotes || undefined,
          resolvedAt: new Date(),
          resolvedById: auth.userId,
        },
      })
    })

    return NextResponse.json({ request: approved })
  } catch (error) {
    console.error("Failed to update class swap request:", error)
    return NextResponse.json({ error: "Failed to update class swap request" }, { status: 500 })
  }
}

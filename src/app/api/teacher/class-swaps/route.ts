import { NextRequest, NextResponse } from "next/server"
import { ClassSwapRequestStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { findClassSwapConflict } from "@/lib/class-swaps"
import { getSession } from "@/lib/session"

function normalizeStatus(status: string | null): ClassSwapRequestStatus | null {
  if (!status) return null
  if (status === ClassSwapRequestStatus.PENDING) return ClassSwapRequestStatus.PENDING
  if (status === ClassSwapRequestStatus.APPROVED) return ClassSwapRequestStatus.APPROVED
  if (status === ClassSwapRequestStatus.DECLINED) return ClassSwapRequestStatus.DECLINED
  if (status === ClassSwapRequestStatus.CANCELLED) return ClassSwapRequestStatus.CANCELLED
  return null
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId || !session.user.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const studioId = session.user.studioId
  const teacherId = session.user.teacherId

  const statusFilter = normalizeStatus(request.nextUrl.searchParams.get("status"))

  try {
    const requests = await db.classSwapRequest.findMany({
      where: {
        studioId,
        fromTeacherId: teacherId,
        ...(statusFilter ? { status: statusFilter } : {}),
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
        toTeacher: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Failed to fetch class swap requests:", error)
    return NextResponse.json({ error: "Failed to fetch class swap requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.teacherId || !session.user.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const studioId = session.user.studioId
  const teacherId = session.user.teacherId

  try {
    const body = await request.json()
    const classSessionId = typeof body.classSessionId === "string" ? body.classSessionId : ""
    const toTeacherId = typeof body.toTeacherId === "string" ? body.toTeacherId : ""
    const notes = typeof body.notes === "string" ? body.notes.trim() : ""

    if (!classSessionId || !toTeacherId) {
      return NextResponse.json(
        { error: "Class session and target teacher are required" },
        { status: 400 }
      )
    }

    const [studio, classSession, targetTeacher] = await Promise.all([
      db.studio.findUnique({
        where: { id: studioId },
        select: { id: true, requiresClassSwapApproval: true },
      }),
      db.classSession.findFirst({
        where: {
          id: classSessionId,
          studioId,
          teacherId,
        },
        include: {
          classType: { select: { name: true } },
          location: { select: { name: true } },
        },
      }),
      db.teacher.findFirst({
        where: {
          id: toTeacherId,
          studioId,
          isActive: true,
        },
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

    if (!studio || !classSession || !targetTeacher) {
      return NextResponse.json({ error: "Invalid class or teacher selection" }, { status: 400 })
    }
    if (classSession.startTime <= new Date()) {
      return NextResponse.json(
        { error: "Only upcoming classes can be swapped" },
        { status: 400 }
      )
    }
    if (toTeacherId === teacherId) {
      return NextResponse.json(
        { error: "Choose a different teacher to swap with" },
        { status: 400 }
      )
    }

    const existingPending = await db.classSwapRequest.findFirst({
      where: {
        classSessionId,
        fromTeacherId: teacherId,
        status: ClassSwapRequestStatus.PENDING,
      },
      select: { id: true },
    })
    if (existingPending) {
      return NextResponse.json(
        { error: "A swap request for this class is already pending" },
        { status: 409 }
      )
    }

    const conflict = await findClassSwapConflict({
      studioId,
      targetTeacherId: toTeacherId,
      startTime: classSession.startTime,
      endTime: classSession.endTime,
      excludeClassSessionId: classSession.id,
    })
    if (conflict) {
      return NextResponse.json({ error: conflict.message, code: conflict.code }, { status: 409 })
    }

    const requiresApproval = studio.requiresClassSwapApproval !== false

    if (requiresApproval) {
      const pendingRequest = await db.classSwapRequest.create({
        data: {
          studioId,
          classSessionId,
          fromTeacherId: teacherId,
          toTeacherId,
          notes: notes || undefined,
          status: ClassSwapRequestStatus.PENDING,
        },
        include: {
          toTeacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      })

      return NextResponse.json({
        mode: "PENDING_APPROVAL",
        request: pendingRequest,
      })
    }

    const approvedRequest = await db.$transaction(async (tx) => {
      await tx.classSession.update({
        where: { id: classSessionId },
        data: { teacherId: toTeacherId },
      })

      return tx.classSwapRequest.create({
        data: {
          studioId,
          classSessionId,
          fromTeacherId: teacherId,
          toTeacherId,
          notes: notes || undefined,
          adminNotes: "Auto-approved by studio setting",
          status: ClassSwapRequestStatus.APPROVED,
          resolvedAt: new Date(),
        },
        include: {
          toTeacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      })
    })

    return NextResponse.json({
      mode: "AUTO_APPROVED",
      request: approvedRequest,
      message: `Class reassigned to ${targetTeacher.user.firstName} ${targetTeacher.user.lastName}.`,
    })
  } catch (error) {
    console.error("Failed to create class swap request:", error)
    return NextResponse.json({ error: "Failed to create class swap request" }, { status: 500 })
  }
}

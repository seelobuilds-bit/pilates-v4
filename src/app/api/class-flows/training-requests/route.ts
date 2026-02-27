import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const CLASS_FLOW_REQUEST_TYPE = "class-flow-request"
const TEACHER_TRAINING_REQUEST_TYPE = "teacher-training-request"

function getRequestKind(trainingType: string | null | undefined): "CLASS_FLOW" | "TRAINING" {
  return trainingType === CLASS_FLOW_REQUEST_TYPE ? "CLASS_FLOW" : "TRAINING"
}

// GET - Fetch training requests
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const requests = await db.trainingRequest.findMany({
      where: {
        studioId: session.user.studioId,
        // If teacher, only show their requests
        ...(session.user.teacherId && { requestedById: session.user.teacherId })
      },
      include: {
        requestedBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Failed to fetch training requests:", error)
    return NextResponse.json({ error: "Failed to fetch training requests" }, { status: 500 })
  }
}

// POST - Create new training request
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "OWNER" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only studio admins or teachers can create training requests" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      trainingType,
      preferredDate1,
      preferredDate2,
      preferredDate3,
      contactName,
      contactEmail,
      contactPhone,
      location,
      address,
      attendeeCount,
      notes,
      requestKind,
      requestedById: requestedByIdFromBody,
    } = body

    let requestedById = session.user.teacherId
    if (!requestedById && session.user.role === "OWNER") {
      if (typeof requestedByIdFromBody !== "string" || !requestedByIdFromBody.trim()) {
        return NextResponse.json({ error: "Select a teacher for this request" }, { status: 400 })
      }
      const ownerSelectedTeacher = await db.teacher.findFirst({
        where: {
          id: requestedByIdFromBody,
          studioId: session.user.studioId
        },
        select: { id: true }
      })
      if (!ownerSelectedTeacher) {
        return NextResponse.json({ error: "Invalid teacher selected" }, { status: 400 })
      }
      requestedById = ownerSelectedTeacher.id
    }

    if (!requestedById) {
      return NextResponse.json({ error: "Unable to resolve request owner" }, { status: 400 })
    }

    const normalizedRequestKind = requestKind === "CLASS_FLOW" ? "CLASS_FLOW" : "TRAINING"
    const normalizedTrainingType =
      normalizedRequestKind === "CLASS_FLOW"
        ? CLASS_FLOW_REQUEST_TYPE
        : (trainingType || TEACHER_TRAINING_REQUEST_TYPE)
    const normalizedTitle = typeof title === "string" ? title.trim() : ""
    const normalizedDescription = typeof description === "string" ? description.trim() : ""
    const normalizedContactName =
      typeof contactName === "string" && contactName.trim()
        ? contactName.trim()
        : `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Studio Contact"
    const normalizedContactEmail =
      typeof contactEmail === "string" && contactEmail.trim()
        ? contactEmail.trim()
        : session.user.email || ""

    if (!normalizedTitle || !normalizedDescription) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }
    if (!normalizedContactEmail) {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 })
    }

    const trainingRequest = await db.trainingRequest.create({
      data: {
        title: normalizedTitle,
        description: normalizedDescription,
        trainingType: normalizedTrainingType,
        preferredDate1: preferredDate1 ? new Date(preferredDate1) : null,
        preferredDate2: preferredDate2 ? new Date(preferredDate2) : null,
        preferredDate3: preferredDate3 ? new Date(preferredDate3) : null,
        contactName: normalizedContactName,
        contactEmail: normalizedContactEmail,
        contactPhone,
        location,
        address,
        attendeeCount: typeof attendeeCount === "number" && attendeeCount > 0 ? attendeeCount : 1,
        notes,
        studioId: session.user.studioId,
        requestedById
      }
    })

    return NextResponse.json({
      ...trainingRequest,
      requestKind: getRequestKind(trainingRequest.trainingType),
    })
  } catch (error) {
    console.error("Failed to create training request:", error)
    return NextResponse.json({ error: "Failed to create training request" }, { status: 500 })
  }
}

// PATCH - Update training request status (owner approval flow)
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, adminNotes } = body as {
      id?: string
      status?: "PENDING" | "APPROVED" | "SCHEDULED" | "COMPLETED" | "CANCELLED"
      adminNotes?: string
    }

    if (!id || !status) {
      return NextResponse.json({ error: "Request id and status are required" }, { status: 400 })
    }

    const current = await db.trainingRequest.findFirst({
      where: { id, studioId: session.user.studioId },
      include: {
        requestedBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    })

    if (!current) {
      return NextResponse.json({ error: "Training request not found" }, { status: 404 })
    }

    const updated = await db.trainingRequest.update({
      where: { id: current.id },
      data: {
        status,
        ...(typeof adminNotes === "string" ? { adminNotes } : {})
      },
      include: {
        requestedBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    })

    const requestKind = getRequestKind(updated.trainingType)
    const action =
      status === "APPROVED"
        ? requestKind === "CLASS_FLOW"
          ? { type: "CLASS_FLOW_CONTENT" as const, destination: "/studio/class-flows" }
          : { type: "TRAINING_BOOKING" as const, destination: "/studio/class-flows" }
        : null

    return NextResponse.json({
      ...updated,
      requestKind,
      action,
    })
  } catch (error) {
    console.error("Failed to update training request:", error)
    return NextResponse.json({ error: "Failed to update training request" }, { status: 500 })
  }
}




















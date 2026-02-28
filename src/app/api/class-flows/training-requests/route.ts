import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const CLASS_FLOW_REQUEST_TYPE = "class-flow-request"
const TEACHER_TRAINING_REQUEST_TYPE = "teacher-training-request"
const ADMIN_NOTES_META_PREFIX = "[[sfmeta]]"

type RequestKind = "CLASS_FLOW" | "TRAINING"
type RequestSource = "TEACHER" | "OWNER"

interface RequestMeta {
  source?: RequestSource
  kind?: RequestKind
  trainingSubtype?: string
  forwardedToHqAt?: string
  forwardedRequestId?: string
  forwardedFromRequestId?: string
  internalBlockedTimeId?: string
  internalBlockedTimeIds?: string[]
  internalTeacherId?: string
  internalTeacherIds?: string[]
  handledInternally?: boolean
  internalOnly?: boolean
}

function getRequestKind(trainingType: string | null | undefined): RequestKind {
  return trainingType === CLASS_FLOW_REQUEST_TYPE ? "CLASS_FLOW" : "TRAINING"
}

function parseAdminNotes(input: string | null | undefined) {
  if (!input) return { meta: {} as RequestMeta, plain: null as string | null }
  if (!input.startsWith(ADMIN_NOTES_META_PREFIX)) return { meta: {} as RequestMeta, plain: input }

  const newlineIndex = input.indexOf("\n")
  const metaRaw =
    newlineIndex === -1
      ? input.slice(ADMIN_NOTES_META_PREFIX.length)
      : input.slice(ADMIN_NOTES_META_PREFIX.length, newlineIndex)
  const plainRaw = newlineIndex === -1 ? "" : input.slice(newlineIndex + 1)

  try {
    const parsedMeta = JSON.parse(metaRaw) as RequestMeta
    return {
      meta: parsedMeta || {},
      plain: plainRaw.trim() ? plainRaw : null,
    }
  } catch {
    return { meta: {} as RequestMeta, plain: input }
  }
}

function encodeAdminNotes(meta: RequestMeta, plain: string | null | undefined) {
  const cleanPlain = typeof plain === "string" ? plain.trim() : ""
  return `${ADMIN_NOTES_META_PREFIX}${JSON.stringify(meta)}${cleanPlain ? `\n${cleanPlain}` : ""}`
}

function formatScheduledWindow(start: Date, end: Date) {
  return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
}

function getExistingInternalBlockedIds(meta: RequestMeta) {
  const ids = new Set<string>()

  if (typeof meta.internalBlockedTimeId === "string" && meta.internalBlockedTimeId.trim()) {
    ids.add(meta.internalBlockedTimeId.trim())
  }

  for (const id of meta.internalBlockedTimeIds || []) {
    if (typeof id === "string" && id.trim()) {
      ids.add(id.trim())
    }
  }

  return Array.from(ids)
}

function resolveAssignedTeacherIds(
  assignedTeacherIds: unknown,
  assignedTeacherId: unknown,
  fallbackTeacherId: string
) {
  const ids = Array.isArray(assignedTeacherIds)
    ? assignedTeacherIds.filter((value): value is string => typeof value === "string")
    : []

  if (typeof assignedTeacherId === "string") {
    ids.push(assignedTeacherId)
  }

  if (ids.length === 0) {
    ids.push(fallbackTeacherId)
  }

  return Array.from(
    new Set(
      ids
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

async function scheduleInternalTrainingForRequest({
  studioId,
  requestTitle,
  fallbackTeacherId,
  existingMeta,
  scheduledStart,
  scheduledEnd,
  assignedTeacherIds,
}: {
  studioId: string
  requestTitle: string
  fallbackTeacherId: string
  existingMeta: RequestMeta
  scheduledStart?: string
  scheduledEnd?: string
  assignedTeacherIds: string[]
}) {
  const start = scheduledStart ? new Date(scheduledStart) : null
  const end = scheduledEnd ? new Date(scheduledEnd) : null
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Valid internal training start and end times are required")
  }

  const teacherIds = resolveAssignedTeacherIds(assignedTeacherIds, null, fallbackTeacherId)
  if (teacherIds.length === 0) {
    throw new Error("Select at least one teacher for the internal training session")
  }

  const teachers = await db.teacher.findMany({
    where: {
      id: { in: teacherIds },
      studioId,
    },
    select: { id: true },
  })

  if (teachers.length !== teacherIds.length) {
    throw new Error("One or more selected teachers could not be found")
  }

  const existingBlockedIds = getExistingInternalBlockedIds(existingMeta)
  const timeOverlapFilter = {
    OR: [
      { startTime: { gte: start, lt: end } },
      { endTime: { gt: start, lte: end } },
      { AND: [{ startTime: { lte: start } }, { endTime: { gte: end } }] },
    ],
  }

  for (const teacherId of teacherIds) {
    const conflictingClasses = await db.classSession.findMany({
      where: {
        teacherId,
        ...timeOverlapFilter,
      },
      select: { id: true },
      take: 1,
    })

    if (conflictingClasses.length > 0) {
      throw new Error("One or more selected teachers already have classes during that internal training slot")
    }

    const conflictingBlockedTimes = await db.teacherBlockedTime.findMany({
      where: {
        teacherId,
        ...(existingBlockedIds.length > 0 ? { id: { notIn: existingBlockedIds } } : {}),
        ...timeOverlapFilter,
      },
      select: { id: true },
      take: 1,
    })

    if (conflictingBlockedTimes.length > 0) {
      throw new Error("One or more selected teachers already have blocked time during that training slot")
    }
  }

  if (existingBlockedIds.length > 0) {
    await db.teacherBlockedTime.deleteMany({
      where: {
        id: { in: existingBlockedIds },
      },
    })
  }

  const blockedReason = `Internal Training: ${requestTitle}`
  const createdBlockedTimes = await Promise.all(
    teacherIds.map((teacherId) =>
      db.teacherBlockedTime.create({
        data: {
          teacherId,
          startTime: start,
          endTime: end,
          reason: blockedReason,
          isRecurring: false,
          recurringDays: [],
        },
      })
    )
  )

  return {
    nextMeta: {
      ...existingMeta,
      internalBlockedTimeId: createdBlockedTimes[0]?.id,
      internalBlockedTimeIds: createdBlockedTimes.map((entry) => entry.id),
      internalTeacherId: teacherIds[0],
      internalTeacherIds: teacherIds,
      handledInternally: true,
      internalOnly: true,
    } satisfies RequestMeta,
    start,
    end,
    teacherIds,
  }
}

function inferRequestSource(meta: RequestMeta, trainingType: string): RequestSource {
  if (meta.source === "TEACHER" || meta.source === "OWNER") return meta.source
  return trainingType === CLASS_FLOW_REQUEST_TYPE ? "TEACHER" : "OWNER"
}

function normalizeTrainingRequest<T extends { trainingType: string; adminNotes: string | null }>(request: T) {
  const parsed = parseAdminNotes(request.adminNotes)
  const requestKind = parsed.meta.kind || getRequestKind(request.trainingType)
  const requestSource = inferRequestSource(parsed.meta, request.trainingType)
  const trainingSubtype =
    requestKind === "TRAINING" ? parsed.meta.trainingSubtype || request.trainingType : null

  return {
    ...request,
    requestKind,
    requestSource,
    trainingSubtype,
    adminNotes: parsed.plain,
    metadata: parsed.meta,
  }
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

    return NextResponse.json(requests.map((request) => normalizeTrainingRequest(request)))
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
      requestSource,
      requestedById: requestedByIdFromBody,
      scheduleInternally,
      scheduledStart,
      scheduledEnd,
      assignedTeacherIds,
    } = body

    let requestedById = session.user.teacherId
    if (!requestedById && session.user.role === "OWNER") {
      const ownerSelectedTeacher = await db.teacher.findFirst({
        where: {
          ...(typeof requestedByIdFromBody === "string" && requestedByIdFromBody.trim()
            ? { id: requestedByIdFromBody }
            : {}),
          studioId: session.user.studioId
        },
        select: { id: true }
      })
      if (!ownerSelectedTeacher) {
        return NextResponse.json({ error: "At least one active teacher is required before sending requests" }, { status: 400 })
      }
      requestedById = ownerSelectedTeacher.id
    }

    if (!requestedById) {
      return NextResponse.json({ error: "Unable to resolve request owner" }, { status: 400 })
    }

    const normalizedRequestKind = requestKind === "CLASS_FLOW" ? "CLASS_FLOW" : "TRAINING"
    const normalizedRequestSource: RequestSource =
      requestSource === "OWNER" || (session.user.role === "OWNER" && requestSource !== "TEACHER")
        ? "OWNER"
        : "TEACHER"
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

    const shouldScheduleInternally = scheduleInternally === true && normalizedRequestKind === "TRAINING" && session.user.role === "OWNER"
    const initialTeacherIds = shouldScheduleInternally
      ? resolveAssignedTeacherIds(assignedTeacherIds, null, requestedById)
      : [requestedById]
    if (shouldScheduleInternally && initialTeacherIds[0]) {
      requestedById = initialTeacherIds[0]
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
        attendeeCount:
          typeof attendeeCount === "number" && attendeeCount > 0
            ? attendeeCount
            : initialTeacherIds.length,
        notes,
        adminNotes: encodeAdminNotes(
          {
            source: normalizedRequestSource,
            kind: normalizedRequestKind,
            ...(normalizedRequestKind === "TRAINING" ? { trainingSubtype: normalizedTrainingType } : {}),
            ...(shouldScheduleInternally ? { internalOnly: true } : {}),
          },
          null
        ),
        studioId: session.user.studioId,
        requestedById
      }
    })

    if (shouldScheduleInternally) {
      const parsed = parseAdminNotes(trainingRequest.adminNotes)
      const { nextMeta, start, end, teacherIds } = await scheduleInternalTrainingForRequest({
        studioId: session.user.studioId,
        requestTitle: trainingRequest.title,
        fallbackTeacherId: requestedById,
        existingMeta: parsed.meta,
        scheduledStart,
        scheduledEnd,
        assignedTeacherIds: initialTeacherIds,
      })

      const scheduledRequest = await db.trainingRequest.update({
        where: { id: trainingRequest.id },
        data: {
          status: "SCHEDULED",
          attendeeCount: teacherIds.length,
          scheduledDate: start,
          scheduledTime: formatScheduledWindow(start, end),
          adminNotes: encodeAdminNotes(nextMeta, parsed.plain),
        },
      })

      return NextResponse.json(normalizeTrainingRequest(scheduledRequest))
    }

    return NextResponse.json(normalizeTrainingRequest(trainingRequest))
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
    const { id, status, adminNotes, sendToHQ, scheduleInternally, scheduledStart, scheduledEnd, assignedTeacherId, assignedTeacherIds } = body as {
      id?: string
      status?: "PENDING" | "APPROVED" | "SCHEDULED" | "COMPLETED" | "CANCELLED"
      adminNotes?: string
      sendToHQ?: boolean
      scheduleInternally?: boolean
      scheduledStart?: string
      scheduledEnd?: string
      assignedTeacherId?: string
      assignedTeacherIds?: string[]
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

    const currentParsed = parseAdminNotes(current.adminNotes)
    const currentKind = currentParsed.meta.kind || getRequestKind(current.trainingType)
    const currentSource = inferRequestSource(currentParsed.meta, current.trainingType)
    const currentTrainingSubtype =
      currentKind === "TRAINING" ? currentParsed.meta.trainingSubtype || current.trainingType : undefined

    let targetStatus = status
    let mergedMeta: RequestMeta = {
      ...currentParsed.meta,
      ...(currentKind === "TRAINING" && currentTrainingSubtype ? { trainingSubtype: currentTrainingSubtype } : {}),
    }

    if (scheduleInternally) {
      if (currentKind !== "TRAINING") {
        return NextResponse.json({ error: "Only training requests can be scheduled internally" }, { status: 400 })
      }

      const resolvedTeacherIds = resolveAssignedTeacherIds(assignedTeacherIds, assignedTeacherId, current.requestedById)
      try {
        const { nextMeta, start, end, teacherIds } = await scheduleInternalTrainingForRequest({
          studioId: session.user.studioId,
          requestTitle: current.title,
          fallbackTeacherId: current.requestedById,
          existingMeta: mergedMeta,
          scheduledStart,
          scheduledEnd,
          assignedTeacherIds: resolvedTeacherIds,
        })

        mergedMeta = nextMeta
        current.attendeeCount = teacherIds.length
        current.scheduledDate = start
        current.scheduledTime = formatScheduledWindow(start, end)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to schedule internal training" },
          { status: 400 }
        )
      }
      targetStatus = "SCHEDULED"
    }

    let forwardedRequest: Record<string, unknown> | null = null
    if (sendToHQ && status === "APPROVED" && currentKind === "TRAINING" && currentSource === "TEACHER") {
      const createdForward = await db.trainingRequest.create({
        data: {
          title: current.title,
          description: current.description,
          trainingType: currentTrainingSubtype || TEACHER_TRAINING_REQUEST_TYPE,
          preferredDate1: current.preferredDate1,
          preferredDate2: current.preferredDate2,
          preferredDate3: current.preferredDate3,
          contactName: current.contactName,
          contactEmail: current.contactEmail,
          contactPhone: current.contactPhone,
          location: current.location,
          address: current.address,
          attendeeCount: current.attendeeCount,
          notes: current.notes,
          adminNotes: encodeAdminNotes(
            {
              source: "OWNER",
              kind: "TRAINING",
              trainingSubtype: currentTrainingSubtype || TEACHER_TRAINING_REQUEST_TYPE,
              forwardedFromRequestId: current.id,
            },
            "Auto-created from teacher-approved request"
          ),
          studioId: current.studioId,
          requestedById: current.requestedById,
          status: "PENDING",
        },
      })
      forwardedRequest = normalizeTrainingRequest(createdForward)
    }

    mergedMeta = {
      ...mergedMeta,
      ...(forwardedRequest
        ? {
            forwardedToHqAt: new Date().toISOString(),
            forwardedRequestId: String((forwardedRequest as { id?: string }).id || ""),
          }
        : {}),
    }

    const updated = await db.trainingRequest.update({
      where: { id: current.id },
      data: {
        status: targetStatus,
        attendeeCount: current.attendeeCount,
        ...(scheduleInternally && current.scheduledDate && current.scheduledTime
          ? {
              scheduledDate: current.scheduledDate,
              scheduledTime: current.scheduledTime,
            }
          : {}),
        adminNotes: encodeAdminNotes(
          mergedMeta,
          typeof adminNotes === "string" ? adminNotes : currentParsed.plain
        ),
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

    const normalizedUpdated = normalizeTrainingRequest(updated)
    const action =
      targetStatus === "APPROVED" || targetStatus === "SCHEDULED"
        ? normalizedUpdated.requestKind === "CLASS_FLOW"
          ? { type: "CLASS_FLOW_CONTENT" as const, destination: "/studio/class-flows" }
          : scheduleInternally
            ? { type: "TRAINING_SCHEDULED" as const, destination: "/studio/schedule" }
          : sendToHQ
            ? { type: "SENT_TO_HQ" as const, destination: "/studio/class-flows" }
            : { type: "TRAINING_REVIEWED" as const, destination: "/studio/class-flows" }
        : null

    return NextResponse.json({
      ...normalizedUpdated,
      action,
      ...(forwardedRequest ? { forwardedRequest } : {}),
    })
  } catch (error) {
    console.error("Failed to update training request:", error)
    return NextResponse.json({ error: "Failed to update training request" }, { status: 500 })
  }
}













import { db } from "@/lib/db"

interface SwapConflictCheckInput {
  studioId: string
  targetTeacherId: string
  startTime: Date
  endTime: Date
  excludeClassSessionId: string
}

export interface SwapConflictResult {
  message: string
  code: "SCHEDULE_CONFLICT" | "BLOCKED_TIME"
}

export async function findClassSwapConflict(
  input: SwapConflictCheckInput
): Promise<SwapConflictResult | null> {
  const scheduleConflict = await db.classSession.findFirst({
    where: {
      studioId: input.studioId,
      teacherId: input.targetTeacherId,
      id: { not: input.excludeClassSessionId },
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
    include: {
      classType: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  })

  if (scheduleConflict) {
    return {
      code: "SCHEDULE_CONFLICT",
      message: `Target teacher already has ${scheduleConflict.classType.name} at ${scheduleConflict.location.name} in this time slot.`,
    }
  }

  const blockedConflict = await db.teacherBlockedTime.findFirst({
    where: {
      teacherId: input.targetTeacherId,
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
    orderBy: { startTime: "asc" },
  })

  if (blockedConflict) {
    return {
      code: "BLOCKED_TIME",
      message: "Target teacher is blocked/unavailable in this time slot.",
    }
  }

  return null
}

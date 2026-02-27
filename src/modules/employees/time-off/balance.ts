import { TimeOffRequestStatus, TimeOffRequestType } from "@prisma/client"
import { db } from "@/lib/db"
import {
  calculateAnnualLeaveEntitledDays,
  calculateDaysWithinYear,
  yearsInRange,
} from "@/modules/employees/time-off/calculations"
import { getEffectiveTimeOffPolicy } from "@/modules/employees/time-off/policy"

interface RecalculateBalanceInput {
  studioId: string
  teacherId: string
  year: number
}

export async function recalculateTeacherTimeOffBalance({
  studioId,
  teacherId,
  year,
}: RecalculateBalanceInput) {
  const policy = await getEffectiveTimeOffPolicy(studioId)

  const annualLeaveEntitledDays = calculateAnnualLeaveEntitledDays(
    policy.annualLeaveWeeks,
    policy.workingDaysPerWeek
  )
  const sickPaidEntitledDays = Number(policy.paidSickDaysPerYear.toFixed(2))

  const requests = await db.timeOffRequest.findMany({
    where: {
      studioId,
      teacherId,
      status: TimeOffRequestStatus.APPROVED,
      startDate: { lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)) },
      endDate: { gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)) },
    },
    select: {
      type: true,
      startDate: true,
      endDate: true,
      isHalfDayStart: true,
      isHalfDayEnd: true,
    },
  })

  let annualLeaveUsedDays = 0
  let sickPaidUsedDays = 0

  for (const request of requests) {
    const requestDaysInYear = calculateDaysWithinYear(
      request.startDate,
      request.endDate,
      year,
      request.isHalfDayStart,
      request.isHalfDayEnd
    )

    if (request.type === TimeOffRequestType.HOLIDAY) {
      annualLeaveUsedDays += requestDaysInYear
    }

    if (request.type === TimeOffRequestType.SICK) {
      sickPaidUsedDays += requestDaysInYear
    }
  }

  const balance = await db.timeOffBalance.upsert({
    where: {
      studioId_teacherId_year: {
        studioId,
        teacherId,
        year,
      },
    },
    create: {
      studioId,
      teacherId,
      year,
      annualLeaveEntitledDays,
      annualLeaveUsedDays: Number(annualLeaveUsedDays.toFixed(2)),
      sickPaidEntitledDays,
      sickPaidUsedDays: Number(sickPaidUsedDays.toFixed(2)),
      lastRecalculatedAt: new Date(),
    },
    update: {
      annualLeaveEntitledDays,
      annualLeaveUsedDays: Number(annualLeaveUsedDays.toFixed(2)),
      sickPaidEntitledDays,
      sickPaidUsedDays: Number(sickPaidUsedDays.toFixed(2)),
      lastRecalculatedAt: new Date(),
    },
  })

  return balance
}

export async function recalculateBalancesForRequestRange(params: {
  studioId: string
  teacherId: string
  startDate: Date
  endDate: Date
}) {
  const impactedYears = yearsInRange(params.startDate, params.endDate)

  if (impactedYears.length === 0) {
    return []
  }

  const results = []
  for (const year of impactedYears) {
    const balance = await recalculateTeacherTimeOffBalance({
      studioId: params.studioId,
      teacherId: params.teacherId,
      year,
    })
    results.push(balance)
  }

  return results
}

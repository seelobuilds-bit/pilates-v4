import { StudioCountry, TimeOffRequestStatus, TimeOffRequestType } from "@prisma/client"
import { db } from "../../src/lib/db"
import {
  calculateAnnualLeaveEntitledDays,
  calculateDaysWithinYear,
  calculateRequestedDays,
  yearsInRange,
} from "../../src/modules/employees/time-off/calculations"

let passed = 0
let failed = 0
let skipped = 0

function pass(label: string, details?: string) {
  console.log(`PASS ${label}${details ? ` -> ${details}` : ""}`)
  passed += 1
}

function fail(label: string, details?: string) {
  console.log(`FAIL ${label}${details ? ` -> ${details}` : ""}`)
  failed += 1
}

function skip(label: string, details?: string) {
  console.log(`SKIP ${label}${details ? ` -> ${details}` : ""}`)
  skipped += 1
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    pass(label, String(actual))
    return
  }
  fail(label, `expected ${String(expected)} but got ${String(actual)}`)
}

function assertApprox(label: string, actual: number, expected: number, epsilon = 0.01) {
  if (Math.abs(actual - expected) <= epsilon) {
    pass(label, actual.toFixed(2))
    return
  }
  fail(label, `expected ${expected.toFixed(2)} but got ${actual.toFixed(2)}`)
}

async function ensureCountryPolicy(country: StudioCountry) {
  const defaults =
    country === StudioCountry.IE
      ? { annualLeaveWeeks: 4, paidSickDaysPerYear: 5, workingDaysPerWeekDefault: 5 }
      : country === StudioCountry.US
        ? { annualLeaveWeeks: 2, paidSickDaysPerYear: 0, workingDaysPerWeekDefault: 5 }
        : { annualLeaveWeeks: 4, paidSickDaysPerYear: 0, workingDaysPerWeekDefault: 5 }

  return db.timeOffPolicy.upsert({
    where: { country },
    create: {
      country,
      defaultAnnualLeaveWeeks: defaults.annualLeaveWeeks,
      defaultPaidSickDaysPerYear: defaults.paidSickDaysPerYear,
      workingDaysPerWeekDefault: defaults.workingDaysPerWeekDefault,
    },
    update: {},
  })
}

async function getEffectivePolicy(studioId: string) {
  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: {
      country: true,
      timeOffPolicyOverride: {
        select: {
          annualLeaveWeeksOverride: true,
          paidSickDaysOverride: true,
          workingDaysPerWeekOverride: true,
          policy: {
            select: {
              country: true,
              defaultAnnualLeaveWeeks: true,
              defaultPaidSickDaysPerYear: true,
              workingDaysPerWeekDefault: true,
            },
          },
        },
      },
    },
  })

  if (!studio) throw new Error("Studio not found")
  const policy = studio.timeOffPolicyOverride?.policy || (await ensureCountryPolicy(studio.country))
  return {
    annualLeaveWeeks: studio.timeOffPolicyOverride?.annualLeaveWeeksOverride ?? policy.defaultAnnualLeaveWeeks,
    paidSickDaysPerYear:
      studio.timeOffPolicyOverride?.paidSickDaysOverride ?? policy.defaultPaidSickDaysPerYear,
    workingDaysPerWeek:
      studio.timeOffPolicyOverride?.workingDaysPerWeekOverride ?? policy.workingDaysPerWeekDefault,
  }
}

async function getModuleAccess(studioId: string) {
  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: { invoicesEnabled: true, employeesEnabled: true },
  })
  return {
    invoicesEnabled: studio?.invoicesEnabled !== false,
    employeesEnabled: studio?.employeesEnabled === true,
  }
}

async function recalculateBalance(studioId: string, teacherId: string, year: number) {
  const policy = await getEffectivePolicy(studioId)
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
    const days = calculateDaysWithinYear(
      request.startDate,
      request.endDate,
      year,
      request.isHalfDayStart,
      request.isHalfDayEnd
    )
    if (request.type === TimeOffRequestType.HOLIDAY) annualLeaveUsedDays += days
    if (request.type === TimeOffRequestType.SICK) sickPaidUsedDays += days
  }

  return db.timeOffBalance.upsert({
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
}

async function main() {
  const runId = `timeoff-${Date.now()}`
  const ownerEmail = `${runId}-owner@example.com`
  const teacherEmail = `${runId}-teacher@example.com`
  const studioSubdomain = `${runId}`.slice(0, 32)
  let ownerId: string | null = null
  let teacherUserId: string | null = null
  let studioId: string | null = null

  try {
    assertApprox("Duration calc: 3 day range with half-day start", calculateRequestedDays("2026-02-01", "2026-02-03", true, false), 2.5)
    assertApprox("Entitlement calc: 4 weeks x 5 days", calculateAnnualLeaveEntitledDays(4, 5), 20)

    const owner = await db.user.create({
      data: {
        email: ownerEmail,
        password: "test-password",
        firstName: "Owner",
        lastName: "Timeoff",
        role: "OWNER",
      },
    })
    ownerId = owner.id

    const studio = await db.studio.create({
      data: {
        name: "Time Off Test Studio",
        subdomain: studioSubdomain,
        ownerId: owner.id,
        country: StudioCountry.IE,
        employeesEnabled: true,
        invoicesEnabled: true,
      },
    })
    studioId = studio.id

    const teacherUser = await db.user.create({
      data: {
        email: teacherEmail,
        password: "test-password",
        firstName: "Teacher",
        lastName: "Timeoff",
        role: "TEACHER",
      },
    })
    teacherUserId = teacherUser.id

    const teacher = await db.teacher.create({
      data: {
        userId: teacherUser.id,
        studioId: studio.id,
        specialties: [],
      },
    })

    await ensureCountryPolicy(StudioCountry.IE)
    await db.studioTimeOffPolicyOverride.upsert({
      where: { studioId: studio.id },
      create: {
        studioId: studio.id,
        annualLeaveWeeksOverride: 5,
        paidSickDaysOverride: 7,
        workingDaysPerWeekOverride: 4,
      },
      update: {
        annualLeaveWeeksOverride: 5,
        paidSickDaysOverride: 7,
        workingDaysPerWeekOverride: 4,
      },
    })

    const policy = await getEffectivePolicy(studio.id)
    assertEqual("Policy override annual leave weeks", policy.annualLeaveWeeks, 5)
    assertEqual("Policy override paid sick days", policy.paidSickDaysPerYear, 7)
    assertEqual("Policy override working days/week", policy.workingDaysPerWeek, 4)

    const moduleAccess = await getModuleAccess(studio.id)
    assertEqual("Module access invoices enabled", moduleAccess.invoicesEnabled, true)
    assertEqual("Module access employees enabled", moduleAccess.employeesEnabled, true)

    await db.timeOffRequest.createMany({
      data: [
        {
          studioId: studio.id,
          teacherId: teacher.id,
          type: TimeOffRequestType.HOLIDAY,
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-02-02"),
          reasonText: "Holiday block",
          status: TimeOffRequestStatus.APPROVED,
        },
        {
          studioId: studio.id,
          teacherId: teacher.id,
          type: TimeOffRequestType.SICK,
          startDate: new Date("2026-03-03"),
          endDate: new Date("2026-03-03"),
          isHalfDayStart: true,
          reasonText: "Half-day sick",
          status: TimeOffRequestStatus.APPROVED,
        },
        {
          studioId: studio.id,
          teacherId: teacher.id,
          type: TimeOffRequestType.HOLIDAY,
          startDate: new Date("2026-04-10"),
          endDate: new Date("2026-04-10"),
          reasonText: "Rejected day",
          status: TimeOffRequestStatus.REJECTED,
        },
      ],
    })

    const impactedYears = yearsInRange("2026-02-01", "2026-04-10")
    assertEqual("Years in request range", impactedYears.join(","), "2026")

    const balanceBefore = await recalculateBalance(studio.id, teacher.id, 2026)

    assertApprox("Annual entitlement from override", balanceBefore.annualLeaveEntitledDays, 20)
    assertApprox("Sick entitlement from override", balanceBefore.sickPaidEntitledDays, 7)
    assertApprox("Approved holiday days counted", balanceBefore.annualLeaveUsedDays, 2)
    assertApprox("Approved half-day sick counted", balanceBefore.sickPaidUsedDays, 0.5)

    await db.timeOffRequest.updateMany({
      where: {
        studioId: studio.id,
        teacherId: teacher.id,
        status: TimeOffRequestStatus.REJECTED,
      },
      data: { status: TimeOffRequestStatus.APPROVED },
    })

    const balanceAfter = await recalculateBalance(studio.id, teacher.id, 2026)

    assertApprox("Approved/rejected transitions update annual usage", balanceAfter.annualLeaveUsedDays, 3)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2022"
    ) {
      skip(
        "DB-integrated employees/time-off checks",
        "database schema is behind code schema; run db push/migration then rerun"
      )
    } else {
      console.error(error)
      fail("employees-timeoff-logic script", error instanceof Error ? error.message : "unknown error")
    }
  } finally {
    if (studioId) {
      await db.studio.delete({ where: { id: studioId } }).catch(() => undefined)
    }
    if (teacherUserId) {
      await db.user.delete({ where: { id: teacherUserId } }).catch(() => undefined)
    }
    if (ownerId) {
      await db.user.delete({ where: { id: ownerId } }).catch(() => undefined)
    }

    console.log(`\nSummary -> passed: ${passed}, failed: ${failed}, skipped: ${skipped}`)
    if (failed > 0) {
      process.exitCode = 1
    }
  }
}

main()

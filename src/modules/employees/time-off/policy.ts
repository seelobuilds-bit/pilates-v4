import { Prisma, StudioCountry } from "@prisma/client"
import { db } from "@/lib/db"

export interface EffectiveTimeOffPolicy {
  country: StudioCountry
  annualLeaveWeeks: number
  paidSickDaysPerYear: number
  workingDaysPerWeek: number
  metadata: Record<string, unknown> | null
}

const COUNTRY_DEFAULTS: Record<StudioCountry, Omit<EffectiveTimeOffPolicy, "country">> = {
  IE: {
    annualLeaveWeeks: 4,
    paidSickDaysPerYear: 5,
    workingDaysPerWeek: 5,
    metadata: {
      note: "Ireland statutory baseline",
      legalBasis: "Organisation of Working Time Act + statutory sick leave baseline",
    },
  },
  UK: {
    annualLeaveWeeks: 4,
    paidSickDaysPerYear: 0,
    workingDaysPerWeek: 5,
    metadata: {
      note: "UK placeholder baseline; configure override per studio",
    },
  },
  US: {
    annualLeaveWeeks: 2,
    paidSickDaysPerYear: 0,
    workingDaysPerWeek: 5,
    metadata: {
      note: "US placeholder baseline; configure override per studio",
    },
  },
}

export async function ensureCountryPolicy(country: StudioCountry) {
  const defaults = COUNTRY_DEFAULTS[country]

  return db.timeOffPolicy.upsert({
    where: { country },
    create: {
      country,
      defaultAnnualLeaveWeeks: defaults.annualLeaveWeeks,
      defaultPaidSickDaysPerYear: defaults.paidSickDaysPerYear,
      workingDaysPerWeekDefault: defaults.workingDaysPerWeek,
      metadata: (defaults.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    update: {},
  })
}

export async function getEffectiveTimeOffPolicy(studioId: string): Promise<EffectiveTimeOffPolicy> {
  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: {
      country: true,
      timeOffPolicyOverride: {
        select: {
          annualLeaveWeeksOverride: true,
          paidSickDaysOverride: true,
          workingDaysPerWeekOverride: true,
          metadata: true,
          policy: {
            select: {
              country: true,
              defaultAnnualLeaveWeeks: true,
              defaultPaidSickDaysPerYear: true,
              workingDaysPerWeekDefault: true,
              metadata: true,
            },
          },
        },
      },
    },
  })

  if (!studio) {
    throw new Error("Studio not found")
  }

  const basePolicy = studio.timeOffPolicyOverride?.policy || (await ensureCountryPolicy(studio.country))

  return {
    country: basePolicy.country,
    annualLeaveWeeks:
      studio.timeOffPolicyOverride?.annualLeaveWeeksOverride ?? basePolicy.defaultAnnualLeaveWeeks,
    paidSickDaysPerYear:
      studio.timeOffPolicyOverride?.paidSickDaysOverride ?? basePolicy.defaultPaidSickDaysPerYear,
    workingDaysPerWeek:
      studio.timeOffPolicyOverride?.workingDaysPerWeekOverride ?? basePolicy.workingDaysPerWeekDefault,
    metadata:
      (studio.timeOffPolicyOverride?.metadata as Record<string, unknown> | null) ??
      (basePolicy.metadata as Record<string, unknown> | null),
  }
}

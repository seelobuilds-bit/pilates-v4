import { NextRequest, NextResponse } from "next/server"
import { StudioCountry } from "@prisma/client"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"
import { ensureCountryPolicy, getEffectiveTimeOffPolicy } from "@/modules/employees/time-off/policy"

const ALLOWED_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud", "nzd"]
const ALLOWED_COUNTRIES = Object.values(StudioCountry)

function hasOwn<T extends object>(obj: T, key: keyof T) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function parseOptionalNumber(value: unknown, fieldName: string): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for ${fieldName}`)
  }

  return parsed
}

// GET - Fetch studio settings
export async function GET() {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  try {
    const studio = await db.studio.findUnique({
      where: { id: auth.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
        requiresClassSwapApproval: true,
        invoicesEnabled: true,
        employeesEnabled: true,
        country: true,
        timeOffPolicyOverride: {
          select: {
            annualLeaveWeeksOverride: true,
            paidSickDaysOverride: true,
            workingDaysPerWeekOverride: true,
            metadata: true,
          },
        },
      }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const policy = await getEffectiveTimeOffPolicy(auth.studioId)

    return NextResponse.json({
      ...studio,
      timeOffPolicy: {
        annualLeaveWeeks: policy.annualLeaveWeeks,
        paidSickDaysPerYear: policy.paidSickDaysPerYear,
        workingDaysPerWeek: policy.workingDaysPerWeek,
        metadata: policy.metadata,
        overrides: {
          annualLeaveWeeksOverride: studio.timeOffPolicyOverride?.annualLeaveWeeksOverride ?? null,
          paidSickDaysOverride: studio.timeOffPolicyOverride?.paidSickDaysOverride ?? null,
          workingDaysPerWeekOverride: studio.timeOffPolicyOverride?.workingDaysPerWeekOverride ?? null,
          metadata: studio.timeOffPolicyOverride?.metadata ?? null,
        },
      },
    })
  } catch (error) {
    console.error("Failed to fetch studio settings:", error)
    return NextResponse.json({ error: "Failed to fetch studio settings" }, { status: 500 })
  }
}

// PATCH - Update studio settings
export async function PATCH(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  try {
    const body = await request.json()
    const {
      name,
      primaryColor,
      currency,
      requiresClassSwapApproval,
      invoicesEnabled,
      employeesEnabled,
      country,
      timeOffPolicy,
    } = body

    const normalizedCurrency = currency ? String(currency).toLowerCase() : undefined
    if (normalizedCurrency && !ALLOWED_CURRENCIES.includes(normalizedCurrency)) {
      return NextResponse.json({ error: "Invalid currency code" }, { status: 400 })
    }

    const normalizedCountry =
      country === undefined || country === null ? undefined : String(country).toUpperCase()
    if (normalizedCountry && !ALLOWED_COUNTRIES.includes(normalizedCountry as StudioCountry)) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 })
    }

    const currentStudio = await db.studio.findUnique({
      where: { id: auth.studioId },
      select: { id: true, country: true },
    })

    if (!currentStudio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const targetCountry = (normalizedCountry as StudioCountry | undefined) ?? currentStudio.country

    let annualLeaveWeeksRaw: number | null | undefined
    let paidSickDaysRaw: number | null | undefined
    let workingDaysRaw: number | null | undefined

    try {
      annualLeaveWeeksRaw =
        timeOffPolicy && hasOwn(timeOffPolicy, "annualLeaveWeeks")
          ? parseOptionalNumber(timeOffPolicy.annualLeaveWeeks, "annualLeaveWeeks")
          : undefined
      paidSickDaysRaw =
        timeOffPolicy && hasOwn(timeOffPolicy, "paidSickDaysPerYear")
          ? parseOptionalNumber(timeOffPolicy.paidSickDaysPerYear, "paidSickDaysPerYear")
          : undefined
      workingDaysRaw =
        timeOffPolicy && hasOwn(timeOffPolicy, "workingDaysPerWeek")
          ? parseOptionalNumber(timeOffPolicy.workingDaysPerWeek, "workingDaysPerWeek")
          : undefined
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid policy payload"
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const annualLeaveWeeks =
      typeof annualLeaveWeeksRaw === "number" ? Number(annualLeaveWeeksRaw.toFixed(2)) : annualLeaveWeeksRaw
    const paidSickDays =
      typeof paidSickDaysRaw === "number" ? Math.round(paidSickDaysRaw) : paidSickDaysRaw
    const workingDaysPerWeek =
      typeof workingDaysRaw === "number" ? Math.round(workingDaysRaw) : workingDaysRaw

    if (typeof annualLeaveWeeks === "number" && (annualLeaveWeeks <= 0 || annualLeaveWeeks > 12)) {
      return NextResponse.json({ error: "Annual leave weeks must be between 0 and 12" }, { status: 400 })
    }
    if (typeof paidSickDays === "number" && (paidSickDays < 0 || paidSickDays > 365)) {
      return NextResponse.json({ error: "Paid sick days must be between 0 and 365" }, { status: 400 })
    }
    if (typeof workingDaysPerWeek === "number" && (workingDaysPerWeek < 1 || workingDaysPerWeek > 7)) {
      return NextResponse.json({ error: "Working days/week must be between 1 and 7" }, { status: 400 })
    }

    const studio = await db.studio.update({
      where: { id: auth.studioId },
      data: {
        ...(name !== undefined && { name }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(normalizedCurrency !== undefined && { stripeCurrency: normalizedCurrency }),
        ...(requiresClassSwapApproval !== undefined && {
          requiresClassSwapApproval: Boolean(requiresClassSwapApproval),
        }),
        ...(invoicesEnabled !== undefined && { invoicesEnabled: Boolean(invoicesEnabled) }),
        ...(employeesEnabled !== undefined && { employeesEnabled: Boolean(employeesEnabled) }),
        ...(normalizedCountry !== undefined && { country: targetCountry }),
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
        requiresClassSwapApproval: true,
        invoicesEnabled: true,
        employeesEnabled: true,
        country: true,
        timeOffPolicyOverride: {
          select: {
            annualLeaveWeeksOverride: true,
            paidSickDaysOverride: true,
            workingDaysPerWeekOverride: true,
            metadata: true,
          },
        },
      }
    })

    const shouldUpsertPolicyOverride =
      timeOffPolicy !== undefined || normalizedCountry !== undefined

    if (shouldUpsertPolicyOverride) {
      const policy = await ensureCountryPolicy(targetCountry)

      await db.studioTimeOffPolicyOverride.upsert({
        where: { studioId: auth.studioId },
        create: {
          studioId: auth.studioId,
          policyId: policy.id,
          annualLeaveWeeksOverride:
            annualLeaveWeeks === undefined ? null : annualLeaveWeeks,
          paidSickDaysOverride:
            paidSickDays === undefined ? null : paidSickDays,
          workingDaysPerWeekOverride:
            workingDaysPerWeek === undefined ? null : workingDaysPerWeek,
        },
        update: {
          policyId: policy.id,
          ...(annualLeaveWeeks !== undefined && { annualLeaveWeeksOverride: annualLeaveWeeks }),
          ...(paidSickDays !== undefined && { paidSickDaysOverride: paidSickDays }),
          ...(workingDaysPerWeek !== undefined && { workingDaysPerWeekOverride: workingDaysPerWeek }),
        },
      })
    }

    const effectivePolicy = await getEffectiveTimeOffPolicy(auth.studioId)

    return NextResponse.json({
      ...studio,
      timeOffPolicy: {
        annualLeaveWeeks: effectivePolicy.annualLeaveWeeks,
        paidSickDaysPerYear: effectivePolicy.paidSickDaysPerYear,
        workingDaysPerWeek: effectivePolicy.workingDaysPerWeek,
        metadata: effectivePolicy.metadata,
      },
    })
  } catch (error) {
    console.error("Failed to update studio settings:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update studio settings"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

import { LeaderboardTimeframe, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import {
  MANUAL_OVERRIDE_END_AT_RANGE_TOKEN,
  MANUAL_OVERRIDE_KEEP_ACTIVE_TOKEN,
  SYSTEM_AUTO_FINALIZE_TOKEN,
  isManualKeepActiveOverride,
} from "@/lib/leaderboards/constants"
import { finalizeLeaderboardPeriod } from "@/lib/leaderboards/finalize"
import { buildPeriodTemplate } from "@/lib/leaderboards/period-template"
import { populateLeaderboardPeriodEntries } from "@/lib/leaderboards/scoring"

interface RunLeaderboardAutoCycleOptions {
  now?: Date
  leaderboardId?: string
}

export interface LeaderboardAutoCycleResult {
  processedLeaderboards: number
  finalizedPeriods: number
  createdPeriods: number
  reactivatedPeriods: number
  seededEntries: number
  skippedManualOverrides: number
}

const CYCLABLE_TIMEFRAMES: LeaderboardTimeframe[] = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "ALL_TIME",
]

function periodHasExpired(period: { endDate: Date }, now: Date) {
  return period.endDate.getTime() < now.getTime()
}

export async function runLeaderboardAutoCycle(
  options: RunLeaderboardAutoCycleOptions = {}
): Promise<LeaderboardAutoCycleResult> {
  const now = options.now ?? new Date()
  const result: LeaderboardAutoCycleResult = {
    processedLeaderboards: 0,
    finalizedPeriods: 0,
    createdPeriods: 0,
    reactivatedPeriods: 0,
    seededEntries: 0,
    skippedManualOverrides: 0,
  }

  const leaderboards = await db.leaderboard.findMany({
    where: {
      isActive: true,
      autoCalculate: true,
      timeframe: { in: CYCLABLE_TIMEFRAMES },
      ...(options.leaderboardId ? { id: options.leaderboardId } : {}),
    },
    select: {
      id: true,
      category: true,
      participantType: true,
      higherIsBetter: true,
      minimumEntries: true,
      metricName: true,
      timeframe: true,
    },
    orderBy: { createdAt: "asc" },
  })

  result.processedLeaderboards = leaderboards.length

  for (const leaderboard of leaderboards) {
    const activePeriods = await db.leaderboardPeriod.findMany({
      where: {
        leaderboardId: leaderboard.id,
        status: "ACTIVE",
      },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        finalizedBy: true,
      },
    })

    const latestActivePeriod = activePeriods[0] ?? null
    const extraActivePeriodIds = activePeriods.slice(1).map((period) => period.id)

    if (extraActivePeriodIds.length > 0) {
      await db.leaderboardPeriod.updateMany({
        where: { id: { in: extraActivePeriodIds } },
        data: {
          status: "ARCHIVED",
          finalizedAt: now,
          finalizedBy: SYSTEM_AUTO_FINALIZE_TOKEN,
        },
      })
    }

    if (latestActivePeriod) {
      if (!periodHasExpired(latestActivePeriod, now)) {
        continue
      }

      if (isManualKeepActiveOverride(latestActivePeriod.finalizedBy)) {
        result.skippedManualOverrides += 1
        continue
      }

      const recalcResult = await populateLeaderboardPeriodEntries({
        leaderboard,
        period: latestActivePeriod,
      })
      result.seededEntries += recalcResult.entriesCreated

      await finalizeLeaderboardPeriod({
        periodId: latestActivePeriod.id,
        finalizedBy: SYSTEM_AUTO_FINALIZE_TOKEN,
      })
      result.finalizedPeriods += 1
    }

    const periodTemplate = buildPeriodTemplate(leaderboard.timeframe, now)
    const existingTemplatePeriod = await db.leaderboardPeriod.findFirst({
      where: {
        leaderboardId: leaderboard.id,
        startDate: periodTemplate.startDate,
        endDate: periodTemplate.endDate,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    })

    const activePeriod = existingTemplatePeriod
      ? existingTemplatePeriod.status === "ACTIVE"
        ? existingTemplatePeriod
        : await db.leaderboardPeriod.update({
            where: { id: existingTemplatePeriod.id },
            data: {
              status: "ACTIVE",
              finalizedAt: null,
              finalizedBy: null,
            },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          })
      : await db.leaderboardPeriod
          .create({
            data: {
              leaderboardId: leaderboard.id,
              name: periodTemplate.name,
              startDate: periodTemplate.startDate,
              endDate: periodTemplate.endDate,
              status: "ACTIVE",
            },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          })
          .catch(async (error: unknown) => {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              const createdByRace = await db.leaderboardPeriod.findFirst({
                where: {
                  leaderboardId: leaderboard.id,
                  startDate: periodTemplate.startDate,
                  endDate: periodTemplate.endDate,
                },
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                  status: true,
                },
              })
              if (createdByRace) return createdByRace
            }
            throw error
          })

    if (existingTemplatePeriod) {
      if (existingTemplatePeriod.status !== "ACTIVE") {
        result.reactivatedPeriods += 1
      }
    } else {
      result.createdPeriods += 1
    }

    if (activePeriod.status === "ACTIVE") {
      const seedResult = await populateLeaderboardPeriodEntries({
        leaderboard,
        period: activePeriod,
      })
      result.seededEntries += seedResult.entriesCreated
    }
  }

  return result
}

export function getManualPeriodFinalizeToken(endAfterTimeframe: boolean) {
  return endAfterTimeframe ? MANUAL_OVERRIDE_END_AT_RANGE_TOKEN : MANUAL_OVERRIDE_KEEP_ACTIVE_TOKEN
}

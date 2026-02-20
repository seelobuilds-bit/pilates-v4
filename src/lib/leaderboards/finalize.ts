import { LeaderboardStatus } from "@prisma/client"
import { db } from "@/lib/db"

function compareEntries(
  left: { id: string; score: number },
  right: { id: string; score: number },
  higherIsBetter: boolean
) {
  if (higherIsBetter) {
    if (left.score !== right.score) return right.score - left.score
  } else if (left.score !== right.score) {
    return left.score - right.score
  }
  return left.id.localeCompare(right.id)
}

interface FinalizeOptions {
  periodId: string
  finalizedBy: string
  status?: LeaderboardStatus
}

export async function finalizeLeaderboardPeriod(options: FinalizeOptions) {
  const period = await db.leaderboardPeriod.findUnique({
    where: { id: options.periodId },
    include: {
      leaderboard: {
        select: {
          higherIsBetter: true,
          prizes: {
            orderBy: { position: "asc" },
            select: { id: true, position: true },
          },
        },
      },
      entries: {
        select: {
          id: true,
          studioId: true,
          teacherId: true,
          score: true,
        },
      },
    },
  })

  if (!period) {
    throw new Error("Period not found")
  }

  const sortedEntries = [...period.entries].sort((left, right) =>
    compareEntries(left, right, period.leaderboard.higherIsBetter)
  )

  const status = options.status ?? "COMPLETED"
  const now = new Date()

  await db.$transaction(async (tx) => {
    await Promise.all(
      sortedEntries.map((entry, index) =>
        tx.leaderboardEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 },
        })
      )
    )

    await tx.leaderboardWinner.deleteMany({
      where: { periodId: period.id },
    })

    for (const prize of period.leaderboard.prizes) {
      const winner = sortedEntries[prize.position - 1]
      if (!winner) continue

      await tx.leaderboardWinner.create({
        data: {
          periodId: period.id,
          prizeId: prize.id,
          studioId: winner.studioId,
          teacherId: winner.teacherId,
          position: prize.position,
          finalScore: winner.score,
          prizeStatus: "pending",
        },
      })
    }

    await tx.leaderboardPeriod.update({
      where: { id: period.id },
      data: {
        status,
        finalizedAt: now,
        finalizedBy: options.finalizedBy,
      },
    })
  })

  return {
    periodId: period.id,
    rankedEntries: sortedEntries.length,
    winnersCreated: Math.min(sortedEntries.length, period.leaderboard.prizes.length),
  }
}

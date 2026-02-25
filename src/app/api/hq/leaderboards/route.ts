import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Prisma, PrizeType } from "@prisma/client"
import { populateLeaderboardPeriodEntries } from "@/lib/leaderboards/scoring"
import { getManualPeriodFinalizeToken, runLeaderboardAutoCycle } from "@/lib/leaderboards/cycle"
import { finalizeLeaderboardPeriod } from "@/lib/leaderboards/finalize"

interface PrizeInput {
  position?: number
  name: string
  description?: string
  prizeType: PrizeType
  prizeValue?: number
  prizeCurrency?: string
  prizeDetails?: Prisma.InputJsonValue | null
  imageUrl?: string
  sponsorName?: string
  sponsorLogo?: string
  sponsorUrl?: string
}

function parsePeriodBoundary(value: string | undefined, endOfDay = false) {
  if (!value || typeof value !== "string") return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const timestamp = `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    const parsed = new Date(timestamp)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

// GET - Fetch all leaderboards for HQ admin
export async function GET() {
  const session = await getSession()

  if (session?.user?.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    if (process.env.LEADERBOARD_AUTO_CYCLE_ON_READ === "1") {
      try {
        await runLeaderboardAutoCycle()
      } catch (cycleError) {
        console.error("HQ leaderboard auto-cycle skipped due to error:", cycleError)
      }
    }

    const leaderboards = await db.leaderboard.findMany({
      include: {
        prizes: {
          orderBy: { position: "asc" }
        },
        periods: {
          orderBy: { startDate: "desc" },
          take: 5,
          include: {
            _count: {
              select: { entries: true, winners: true }
            }
          }
        },
        _count: {
          select: { periods: true, prizes: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Get stats
    const stats = {
      totalLeaderboards: leaderboards.length,
      activeLeaderboards: leaderboards.filter(lb => lb.isActive).length,
      studioLeaderboards: leaderboards.filter(lb => lb.participantType === "STUDIO").length,
      teacherLeaderboards: leaderboards.filter(lb => lb.participantType === "TEACHER").length,
      totalPrizes: leaderboards.reduce((sum, lb) => sum + lb._count.prizes, 0),
      activePeriods: leaderboards.reduce((sum, lb) => 
        sum + lb.periods.filter(p => p.status === "ACTIVE").length, 0
      )
    }

    // Get recent winners
    const recentWinners = await db.leaderboardWinner.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        prize: {
          include: {
            leaderboard: {
              select: { name: true, participantType: true }
            }
          }
        },
        period: {
          select: { name: true }
        }
      }
    })

    // Enrich winners with participant info
    const enrichedWinners = await Promise.all(
      recentWinners.map(async (winner) => {
        let participant = null
        if (winner.studioId) {
          participant = await db.studio.findUnique({
            where: { id: winner.studioId },
            select: { id: true, name: true }
          })
        } else if (winner.teacherId) {
          const teacher = await db.teacher.findUnique({
            where: { id: winner.teacherId },
            include: { user: { select: { firstName: true, lastName: true } } }
          })
          if (teacher) {
            participant = {
              id: teacher.id,
              name: `${teacher.user.firstName} ${teacher.user.lastName}`
            }
          }
        }
        return { ...winner, participant }
      })
    )

    return NextResponse.json({
      leaderboards,
      stats,
      recentWinners: enrichedWinners
    })
  } catch (error) {
    console.error("Failed to fetch leaderboards:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboards" }, { status: 500 })
  }
}

// POST - Create a new leaderboard
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (session?.user?.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      participantType,
      timeframe,
      metricName,
      metricUnit,
      higherIsBetter,
      minimumEntries,
      icon,
      color,
      isActive,
      isFeatured,
      showOnDashboard,
      autoCalculate,
      prizes
    } = body

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug exists
    const existing = await db.leaderboard.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "A leaderboard with this name already exists" }, { status: 400 })
    }

    // Create leaderboard with prizes
    const leaderboard = await db.leaderboard.create({
      data: {
        name,
        slug,
        description,
        category,
        participantType,
        timeframe,
        metricName,
        metricUnit,
        higherIsBetter: higherIsBetter ?? true,
        minimumEntries: minimumEntries ?? 1,
        icon,
        color,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        showOnDashboard: showOnDashboard ?? true,
        autoCalculate: autoCalculate ?? true,
        prizes: prizes?.length > 0 ? {
          create: (prizes as PrizeInput[]).map((prize, index) => ({
            position: prize.position || index + 1,
            name: prize.name,
            description: prize.description,
            prizeType: prize.prizeType,
            prizeValue: prize.prizeValue,
            prizeCurrency: prize.prizeCurrency || "USD",
            prizeDetails:
              prize.prizeDetails === null
                ? Prisma.JsonNull
                : prize.prizeDetails,
            imageUrl: prize.imageUrl,
            sponsorName: prize.sponsorName,
            sponsorLogo: prize.sponsorLogo,
            sponsorUrl: prize.sponsorUrl
          }))
        } : undefined
      },
      include: {
        prizes: {
          orderBy: { position: "asc" }
        }
      }
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("Failed to create leaderboard:", error)
    return NextResponse.json({ error: "Failed to create leaderboard" }, { status: 500 })
  }
}

// PATCH - Update a leaderboard or create period
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (session?.user?.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, leaderboardId, periodId, ...data } = body
    const actorId = session.user.id || "hq-admin"

    if (action === "update") {
      const leaderboard = await db.leaderboard.update({
        where: { id: leaderboardId },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          showOnDashboard: data.showOnDashboard,
          autoCalculate: data.autoCalculate,
          icon: data.icon,
          color: data.color,
          minimumEntries: data.minimumEntries
        },
        include: { prizes: true }
      })
      return NextResponse.json(leaderboard)
    }

    if (action === "createPeriod") {
      const leaderboard = await db.leaderboard.findUnique({
        where: { id: leaderboardId },
        select: {
          id: true,
          category: true,
          participantType: true,
          higherIsBetter: true,
          minimumEntries: true,
          metricName: true,
        },
      })
      if (!leaderboard) {
        return NextResponse.json({ error: "Leaderboard not found" }, { status: 404 })
      }

      const startDate = parsePeriodBoundary(data.startDate, false)
      const endDate = parsePeriodBoundary(data.endDate, true)
      if (!startDate || !endDate || startDate > endDate) {
        return NextResponse.json({ error: "Invalid period date range" }, { status: 400 })
      }

      const endAfterTimeframe = data.endAfterTimeframe !== false

      await db.leaderboardPeriod.updateMany({
        where: {
          leaderboardId,
          status: "ACTIVE",
        },
        data: {
          status: "ARCHIVED",
          finalizedAt: new Date(),
          finalizedBy: actorId,
        },
      })

      const period = await db.leaderboardPeriod.create({
        data: {
          leaderboardId,
          name: data.name,
          startDate,
          endDate,
          status: "ACTIVE",
          finalizedBy: getManualPeriodFinalizeToken(endAfterTimeframe),
        },
      })

      const seedResult = await populateLeaderboardPeriodEntries({ leaderboard, period })

      return NextResponse.json({
        ...period,
        endAfterTimeframe,
        entriesCreated: seedResult.entriesCreated,
      })
    }

    if (action === "recalculatePeriod") {
      const period = await db.leaderboardPeriod.findUnique({
        where: { id: periodId },
        include: {
          leaderboard: {
            select: {
              id: true,
              category: true,
              participantType: true,
              higherIsBetter: true,
              minimumEntries: true,
              metricName: true,
            },
          },
        },
      })
      if (!period) {
        return NextResponse.json({ error: "Period not found" }, { status: 404 })
      }

      const seedResult = await populateLeaderboardPeriodEntries({
        leaderboard: period.leaderboard,
        period: {
          id: period.id,
          startDate: period.startDate,
          endDate: period.endDate,
        },
      })

      return NextResponse.json({
        success: true,
        periodId: period.id,
        entriesCreated: seedResult.entriesCreated,
      })
    }

    if (action === "finalizePeriod") {
      const period = await db.leaderboardPeriod.findUnique({
        where: { id: periodId },
        select: { id: true },
      })
      if (!period) {
        return NextResponse.json({ error: "Period not found" }, { status: 404 })
      }

      const finalized = await finalizeLeaderboardPeriod({
        periodId: period.id,
        finalizedBy: actorId,
      })
      return NextResponse.json({ success: true, ...finalized })
    }

    if (action === "runAutoCycle") {
      const result = await runLeaderboardAutoCycle({
        leaderboardId: typeof leaderboardId === "string" ? leaderboardId : undefined,
      })
      return NextResponse.json({ success: true, ...result })
    }

    if (action === "updatePrizeStatus") {
      const winner = await db.leaderboardWinner.update({
        where: { id: data.winnerId },
        data: {
          prizeStatus: data.status,
          ...(data.status === "claimed" && { claimedAt: new Date() }),
          ...(data.status === "fulfilled" && { fulfilledAt: new Date() }),
          deliveryDetails: data.deliveryDetails,
          notes: data.notes
        }
      })
      return NextResponse.json(winner)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update leaderboard:", error)
    return NextResponse.json({ error: "Failed to update leaderboard" }, { status: 500 })
  }
}







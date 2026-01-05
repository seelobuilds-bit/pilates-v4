import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

// GET - Fetch all leaderboards for HQ admin
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (session?.user?.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
        prizes: prizes?.length > 0 ? {
          create: prizes.map((prize: any, index: number) => ({
            position: prize.position || index + 1,
            name: prize.name,
            description: prize.description,
            prizeType: prize.prizeType,
            prizeValue: prize.prizeValue,
            prizeCurrency: prize.prizeCurrency || "USD",
            prizeDetails: prize.prizeDetails,
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

    if (action === "update") {
      const leaderboard = await db.leaderboard.update({
        where: { id: leaderboardId },
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          showOnDashboard: data.showOnDashboard,
          icon: data.icon,
          color: data.color,
          minimumEntries: data.minimumEntries
        },
        include: { prizes: true }
      })
      return NextResponse.json(leaderboard)
    }

    if (action === "createPeriod") {
      const period = await db.leaderboardPeriod.create({
        data: {
          leaderboardId,
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: "ACTIVE"
        }
      })
      return NextResponse.json(period)
    }

    if (action === "finalizePeriod") {
      // Calculate final rankings and determine winners
      const period = await db.leaderboardPeriod.findUnique({
        where: { id: periodId },
        include: {
          leaderboard: { include: { prizes: true } },
          entries: { orderBy: { score: "desc" } }
        }
      })

      if (!period) {
        return NextResponse.json({ error: "Period not found" }, { status: 404 })
      }

      // Update ranks
      for (let i = 0; i < period.entries.length; i++) {
        await db.leaderboardEntry.update({
          where: { id: period.entries[i].id },
          data: { rank: i + 1 }
        })
      }

      // Create winners for each prize
      for (const prize of period.leaderboard.prizes) {
        const winner = period.entries[prize.position - 1]
        if (winner) {
          await db.leaderboardWinner.create({
            data: {
              periodId: period.id,
              prizeId: prize.id,
              studioId: winner.studioId,
              teacherId: winner.teacherId,
              position: prize.position,
              finalScore: winner.score,
              prizeStatus: "pending"
            }
          })
        }
      }

      // Mark period as completed
      await db.leaderboardPeriod.update({
        where: { id: periodId },
        data: {
          status: "COMPLETED",
          finalizedAt: new Date(),
          finalizedBy: session.user.id
        }
      })

      return NextResponse.json({ success: true })
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















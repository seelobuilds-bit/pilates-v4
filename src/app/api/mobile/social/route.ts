import { MessageDirection } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function buildAccountScope(params: { studioId: string; teacherId?: string | null }) {
  if (params.teacherId) {
    return {
      OR: [{ studioId: params.studioId }, { teacherId: params.teacherId }],
    }
  }

  return {
    OR: [{ studioId: params.studioId }, { teacher: { studioId: params.studioId } }],
  }
}

function buildTrackingScope(params: { studioId: string; teacherId?: string | null }) {
  if (params.teacherId) {
    return {
      OR: [{ studioId: params.studioId }, { teacherId: params.teacherId }],
    }
  }

  return {
    OR: [{ studioId: params.studioId }, { teacher: { studioId: params.studioId } }],
  }
}

function parseProgress(progress: string | null) {
  if (!progress) {
    return {}
  }

  try {
    const parsed = JSON.parse(progress)
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, number>
    }
    return {}
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role === "CLIENT") {
      return NextResponse.json({ error: "Social workspace is available for teacher and studio owner accounts only" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const search = String(request.nextUrl.searchParams.get("search") || "").trim()

    const accountScope = buildAccountScope({
      studioId: studio.id,
      teacherId: decoded.teacherId || null,
    })

    const trackingScope = buildTrackingScope({
      studioId: studio.id,
      teacherId: decoded.teacherId || null,
    })

    const accounts = await db.socialMediaAccount.findMany({
      where: {
        ...accountScope,
        ...(search
          ? {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { displayName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        followerCount: true,
        isActive: true,
        lastSyncedAt: true,
        _count: {
          select: {
            flows: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    })

    const accountIds = accounts.map((account) => account.id)

    const [flows, trackingLinks, unreadMessageCount, unreadConversationGroups, submissions, trainingProgress, featuredTrending] =
      await Promise.all([
        db.socialMediaFlow.findMany({
          where: {
            accountId: { in: accountIds.length > 0 ? accountIds : ["__none__"] },
            ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
          },
          select: {
            id: true,
            name: true,
            triggerType: true,
            isActive: true,
            totalTriggered: true,
            totalBooked: true,
            updatedAt: true,
            account: {
              select: {
                id: true,
                platform: true,
                username: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        db.socialMediaTrackingLink.findMany({
          where: {
            ...trackingScope,
            ...(search
              ? {
                  OR: [
                    { campaign: { contains: search, mode: "insensitive" } },
                    { code: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: {
            id: true,
            code: true,
            campaign: true,
            source: true,
            medium: true,
            clicks: true,
            conversions: true,
            revenue: true,
            fullTrackingUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
        db.socialMediaMessage.count({
          where: {
            accountId: { in: accountIds.length > 0 ? accountIds : ["__none__"] },
            direction: MessageDirection.INBOUND,
            isRead: false,
          },
        }),
        db.socialMediaMessage.groupBy({
          by: ["accountId", "platformUserId"],
          where: {
            accountId: { in: accountIds.length > 0 ? accountIds : ["__none__"] },
            direction: MessageDirection.INBOUND,
            isRead: false,
          },
        }),
        db.socialHomeworkSubmission.findMany({
          where: decoded.teacherId ? { teacherId: decoded.teacherId } : { userId: decoded.sub },
          select: {
            id: true,
            status: true,
            isCompleted: true,
            startedAt: true,
            completedAt: true,
            progress: true,
            trackingCode: true,
            fullTrackingUrl: true,
            homework: {
              select: {
                id: true,
                title: true,
                points: true,
                module: {
                  select: {
                    title: true,
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { startedAt: "desc" },
          take: 20,
        }),
        decoded.teacherId
          ? db.socialTrainingProgress.findMany({
              where: { teacherId: decoded.teacherId },
              select: {
                isCompleted: true,
                watchedPercent: true,
              },
            })
          : Promise.resolve([]),
        db.trendingContent.findMany({
          where: { isHidden: false, isFeatured: true },
          select: {
            id: true,
            platform: true,
            creatorUsername: true,
            category: true,
            contentStyle: true,
            viewCount: true,
            engagementRate: true,
            postUrl: true,
          },
          orderBy: { trendingScore: "desc" },
          take: 6,
        }),
      ])

    const activeHomework = submissions.find((submission) => submission.status === "ACTIVE" && !submission.isCompleted) || null
    const completedHomeworkCount = submissions.filter((submission) => submission.isCompleted).length
    const activeHomeworkCount = submissions.filter((submission) => submission.status === "ACTIVE" && !submission.isCompleted).length

    const totalTrainingModules = trainingProgress.length
    const completedTrainingModules = trainingProgress.filter((item) => item.isCompleted).length
    const averageWatchedPercent =
      trainingProgress.length > 0
        ? Math.round(trainingProgress.reduce((sum, item) => sum + item.watchedPercent, 0) / trainingProgress.length)
        : 0

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      filters: { search },
      stats: {
        totalAccounts: accounts.length,
        activeFlows: flows.filter((flow) => flow.isActive).length,
        unreadMessages: unreadMessageCount,
        unreadConversations: unreadConversationGroups.length,
        totalTrackingClicks: trackingLinks.reduce((sum, link) => sum + link.clicks, 0),
        totalTrackingConversions: trackingLinks.reduce((sum, link) => sum + link.conversions, 0),
        totalTrackingRevenue: trackingLinks.reduce((sum, link) => sum + link.revenue, 0),
      },
      accounts: accounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        followerCount: account.followerCount,
        isActive: account.isActive,
        lastSyncedAt: account.lastSyncedAt ? account.lastSyncedAt.toISOString() : null,
        flowCount: account._count.flows,
        messageCount: account._count.messages,
      })),
      flows: flows.map((flow) => ({
        id: flow.id,
        name: flow.name,
        triggerType: flow.triggerType,
        isActive: flow.isActive,
        totalTriggered: flow.totalTriggered,
        totalBooked: flow.totalBooked,
        updatedAt: flow.updatedAt.toISOString(),
        account: {
          id: flow.account.id,
          platform: flow.account.platform,
          username: flow.account.username,
        },
      })),
      trackingLinks: trackingLinks.map((link) => ({
        id: link.id,
        code: link.code,
        campaign: link.campaign,
        source: link.source,
        medium: link.medium,
        clicks: link.clicks,
        conversions: link.conversions,
        revenue: link.revenue,
        fullTrackingUrl: link.fullTrackingUrl,
        createdAt: link.createdAt.toISOString(),
      })),
      homework: {
        active: activeHomework
          ? {
              id: activeHomework.id,
              status: activeHomework.status,
              isCompleted: activeHomework.isCompleted,
              startedAt: activeHomework.startedAt.toISOString(),
              completedAt: activeHomework.completedAt ? activeHomework.completedAt.toISOString() : null,
              progress: parseProgress(activeHomework.progress),
              trackingCode: activeHomework.trackingCode,
              fullTrackingUrl: activeHomework.fullTrackingUrl,
              homework: {
                id: activeHomework.homework.id,
                title: activeHomework.homework.title,
                points: activeHomework.homework.points,
                moduleTitle: activeHomework.homework.module.title,
                categoryName: activeHomework.homework.module.category.name,
              },
            }
          : null,
        totals: {
          submissions: submissions.length,
          active: activeHomeworkCount,
          completed: completedHomeworkCount,
        },
      },
      training: {
        totalModules: totalTrainingModules,
        completedModules: completedTrainingModules,
        averageWatchedPercent,
      },
      trending: featuredTrending.map((item) => ({
        id: item.id,
        platform: item.platform,
        creatorUsername: item.creatorUsername,
        category: item.category,
        contentStyle: item.contentStyle,
        viewCount: item.viewCount,
        engagementRate: item.engagementRate,
        postUrl: item.postUrl,
      })),
    })
  } catch (error) {
    console.error("Mobile social error:", error)
    return NextResponse.json({ error: "Failed to load social overview" }, { status: 500 })
  }
}

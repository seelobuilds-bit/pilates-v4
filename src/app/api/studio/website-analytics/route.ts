import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import {
  resolveWebsiteAnalyticsRange,
} from "@/lib/website-analytics/reporting"
import { fetchWebsiteAnalyticsSnapshot } from "@/lib/website-analytics/query"

// GET - Fetch website analytics config and data
export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getSession>>
  try {
    session = await getSession()
  } catch (error) {
    console.error("Failed to resolve session for website analytics:", error)
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 })
  }

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const studioId = session.user.studioId!

  const searchParams = request.nextUrl.searchParams
  const { period, startDate, endDate } = resolveWebsiteAnalyticsRange(searchParams.get("period"))
  const dataType = searchParams.get("type") || "overview"

  try {
    // Get or create config
    let config = await db.websiteAnalyticsConfig.findUnique({
      where: { studioId: session.user.studioId }
    })

    if (!config) {
      config = await db.websiteAnalyticsConfig.create({
        data: {
          studioId,
        }
      })
    }

    if (dataType === "config") {
      return NextResponse.json({ config })
    }

    const analytics = await fetchWebsiteAnalyticsSnapshot({
      studioId,
      startDate,
      endDate,
      period,
    })

    return NextResponse.json({
      config,
      range: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      analytics: {
        overview: analytics.overview,
        topPages: analytics.topPages,
        topSources: analytics.topSources,
        deviceBreakdown: analytics.deviceBreakdown,
        recentEvents: analytics.recentEvents,
        visitorTrend: analytics.visitorTrend
      }
    })
  } catch (error) {
    console.error("Failed to fetch website analytics:", error)
    return NextResponse.json({
      config: null,
      range: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      analytics: {
        overview: {
          totalPageViews: 0,
          uniqueVisitors: 0,
          totalConversions: 0,
          conversionRate: "0",
          avgPagesPerVisit: "0",
        },
        topPages: [],
        topSources: [],
        deviceBreakdown: [],
        recentEvents: [],
        visitorTrend: [],
      },
      partial: true,
      warning: "Website analytics are temporarily unavailable. Retry in a moment.",
    })
  }
}

// PATCH - Update website analytics config
export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      websiteUrl,
      platform,
      isEnabled,
      trackPageViews,
      trackClicks,
      trackForms,
      trackScrollDepth,
      trackOutboundLinks,
      conversionGoals
    } = body

    const config = await db.websiteAnalyticsConfig.upsert({
      where: { studioId: session.user.studioId },
      update: {
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(platform !== undefined && { platform }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(trackPageViews !== undefined && { trackPageViews }),
        ...(trackClicks !== undefined && { trackClicks }),
        ...(trackForms !== undefined && { trackForms }),
        ...(trackScrollDepth !== undefined && { trackScrollDepth }),
        ...(trackOutboundLinks !== undefined && { trackOutboundLinks }),
        ...(conversionGoals !== undefined && { conversionGoals: JSON.stringify(conversionGoals) }),
      },
      create: {
        studioId: session.user.studioId,
        websiteUrl,
        platform,
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Failed to update website analytics config:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}









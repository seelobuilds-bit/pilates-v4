import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchWebsiteAnalyticsSnapshot } from "./query"
import {
  buildWebsiteAnalyticsFallbackPayload,
  buildWebsiteAnalyticsPayload,
  toWebsiteAnalyticsRangePayload,
} from "./payload"
import { resolveWebsiteAnalyticsRange } from "./reporting"

export async function buildWebsiteAnalyticsResponse(args: {
  studioId: string
  requestedPeriod: string | null | undefined
  dataType: string | null | undefined
}) {
  const { studioId, requestedPeriod } = args
  const dataType = args.dataType || "overview"
  const { period, startDate, endDate } = resolveWebsiteAnalyticsRange(requestedPeriod)

  try {
    let config = await db.websiteAnalyticsConfig.findUnique({
      where: { studioId },
    })

    if (!config) {
      config = await db.websiteAnalyticsConfig.create({
        data: {
          studioId,
        },
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
      range: toWebsiteAnalyticsRangePayload({ period, startDate, endDate }),
      analytics: buildWebsiteAnalyticsPayload(analytics),
    })
  } catch (error) {
    console.error("Failed to fetch website analytics:", error)
    return NextResponse.json({
      config: null,
      range: toWebsiteAnalyticsRangePayload({ period, startDate, endDate }),
      analytics: buildWebsiteAnalyticsFallbackPayload(),
      partial: true,
      warning: "Website analytics are temporarily unavailable. Retry in a moment.",
    })
  }
}

export async function upsertWebsiteAnalyticsConfig(args: {
  studioId: string
  body: Record<string, unknown>
}) {
  const { studioId, body } = args
  const {
    websiteUrl,
    platform,
    isEnabled,
    trackPageViews,
    trackClicks,
    trackForms,
    trackScrollDepth,
    trackOutboundLinks,
    conversionGoals,
  } = body

  return db.websiteAnalyticsConfig.upsert({
    where: { studioId },
    update: {
      ...(websiteUrl !== undefined && { websiteUrl: websiteUrl as string | null }),
      ...(platform !== undefined && { platform: platform as string | null }),
      ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
      ...(trackPageViews !== undefined && { trackPageViews: Boolean(trackPageViews) }),
      ...(trackClicks !== undefined && { trackClicks: Boolean(trackClicks) }),
      ...(trackForms !== undefined && { trackForms: Boolean(trackForms) }),
      ...(trackScrollDepth !== undefined && { trackScrollDepth: Boolean(trackScrollDepth) }),
      ...(trackOutboundLinks !== undefined && { trackOutboundLinks: Boolean(trackOutboundLinks) }),
      ...(conversionGoals !== undefined && { conversionGoals: JSON.stringify(conversionGoals) }),
    },
    create: {
      studioId,
      ...(websiteUrl !== undefined && { websiteUrl: websiteUrl as string | null }),
      ...(platform !== undefined && { platform: platform as string | null }),
    },
  })
}

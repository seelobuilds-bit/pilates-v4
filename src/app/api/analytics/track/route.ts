import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST - Track website events (called by the tracking script)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      trackingId, 
      visitorId, 
      type, 
      pageUrl, 
      pageTitle, 
      pagePath,
      eventName,
      eventData,
      elementId,
      elementClass,
      elementText,
      scrollDepth,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      sessionId,
      userAgent,
      browser,
      os,
      device
    } = body

    if (!trackingId || !visitorId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find the studio by tracking ID
    const config = await db.websiteAnalyticsConfig.findUnique({
      where: { trackingId },
      include: { studio: true }
    })

    if (!config || !config.isEnabled) {
      return NextResponse.json({ error: "Invalid tracking ID" }, { status: 404 })
    }

    const studioId = config.studioId

    // Upsert visitor
    let visitor = await db.websiteVisitor.findUnique({
      where: {
        studioId_visitorId: { studioId, visitorId }
      }
    })

    if (!visitor) {
      // Create new visitor
      visitor = await db.websiteVisitor.create({
        data: {
          studioId,
          visitorId,
          userAgent,
          browser,
          os,
          device,
          firstSource: utmSource || (referrer ? "referral" : "direct"),
          firstMedium: utmMedium,
          firstCampaign: utmCampaign,
        }
      })
    } else {
      // Update existing visitor
      await db.websiteVisitor.update({
        where: { id: visitor.id },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: type === "PAGE_VIEW" ? 1 : 0 },
          totalPageViews: { increment: type === "PAGE_VIEW" ? 1 : 0 },
        }
      })
    }

    // Check tracking settings
    const shouldTrack = (
      (type === "PAGE_VIEW" && config.trackPageViews) ||
      (type === "CLICK" && config.trackClicks) ||
      (type === "FORM_SUBMIT" && config.trackForms) ||
      (type === "SCROLL_DEPTH" && config.trackScrollDepth) ||
      (type === "OUTBOUND_LINK" && config.trackOutboundLinks) ||
      type === "CONVERSION" ||
      type === "CUSTOM"
    )

    if (!shouldTrack) {
      return NextResponse.json({ success: true, tracked: false })
    }

    // Create event
    await db.websiteEvent.create({
      data: {
        studioId,
        visitorId: visitor.id,
        type,
        pageUrl,
        pageTitle,
        pagePath,
        eventName,
        eventData: eventData ? JSON.stringify(eventData) : null,
        elementId,
        elementClass,
        elementText,
        scrollDepth,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        sessionId,
      }
    })

    // If conversion, update visitor
    if (type === "CONVERSION" && !visitor.hasConverted) {
      await db.websiteVisitor.update({
        where: { id: visitor.id },
        data: {
          hasConverted: true,
          convertedAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error("Failed to track event:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}




















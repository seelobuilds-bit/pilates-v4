import { NextRequest, NextResponse } from "next/server"
import { hasStopOnBookingMarker, stripAutomationBodyMarkers } from "@/lib/automation-metadata"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

type MobileMarketingStatusAction = "activate" | "pause"

function ratioPercentage(numerator: number, denominator: number, precision = 1) {
  if (denominator <= 0) return 0
  const factor = Math.pow(10, precision)
  return Math.round((numerator / denominator) * 100 * factor) / factor
}

async function resolveOwnerStudio(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Missing bearer token" }, { status: 401 }) } as const
  }

  const decoded = verifyMobileToken(token)
  if (!decoded) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) } as const
  }

  if (decoded.role !== "OWNER") {
    return {
      error: NextResponse.json({ error: "Marketing is available for studio owner accounts only" }, { status: 403 }),
    } as const
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
    return { error: NextResponse.json({ error: "Studio not found" }, { status: 401 }) } as const
  }

  return {
    studio: {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    },
  } as const
}

function resolveNextStatus(currentStatus: string, action: MobileMarketingStatusAction) {
  if (action === "activate") {
    if (currentStatus === "ARCHIVED") {
      return { error: "Archived automations must be managed on web before reactivation." } as const
    }
    return { status: "ACTIVE" as const }
  }

  if (action === "pause") {
    if (currentStatus === "ARCHIVED") {
      return { error: "Archived automations cannot be paused." } as const
    }
    if (currentStatus === "DRAFT") {
      return { error: "Draft automations cannot be paused until they are activated." } as const
    }
    return { status: "PAUSED" as const }
  }

  return { error: "Invalid action." } as const
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const auth = await resolveOwnerStudio(request)
    if ("error" in auth) {
      return auth.error
    }

    const studio = auth.studio
    const { automationId } = await params
    const automation = await db.automation.findFirst({
      where: {
        id: automationId,
        studioId: studio.id,
      },
      select: {
        id: true,
        name: true,
        trigger: true,
        channel: true,
        status: true,
        subject: true,
        body: true,
        htmlBody: true,
        triggerDelay: true,
        triggerDays: true,
        reminderHours: true,
        totalSent: true,
        totalDelivered: true,
        totalOpened: true,
        totalClicked: true,
        createdAt: true,
        updatedAt: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        steps: {
          orderBy: {
            stepOrder: "asc",
          },
          select: {
            id: true,
            stepId: true,
            stepOrder: true,
            channel: true,
            subject: true,
            body: true,
            htmlBody: true,
            delayMinutes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          select: {
            id: true,
            channel: true,
            direction: true,
            status: true,
            toAddress: true,
            toName: true,
            sentAt: true,
            deliveredAt: true,
            openedAt: true,
            clickedAt: true,
            failedReason: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 120,
        },
      },
    })

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 })
    }

    const body = stripAutomationBodyMarkers(automation.body)
    const stopOnBooking = hasStopOnBookingMarker(automation.body)
    const totalMessages = automation.messages.length
    const failedMessages = automation.messages.filter((message) => message.status === "FAILED" || message.status === "BOUNCED").length

    return NextResponse.json({
      role: "OWNER",
      studio: {
        id: studio.id,
        name: studio.name,
        subdomain: studio.subdomain,
        primaryColor: studio.primaryColor,
        currency: studio.currency,
      },
      automation: {
        id: automation.id,
        name: automation.name,
        trigger: automation.trigger,
        channel: automation.channel,
        status: automation.status,
        subject: automation.subject,
        body,
        htmlBody: automation.htmlBody,
        stopOnBooking,
        triggerDelay: automation.triggerDelay,
        triggerDays: automation.triggerDays,
        reminderHours: automation.reminderHours,
        totalSent: automation.totalSent,
        totalDelivered: automation.totalDelivered,
        totalOpened: automation.totalOpened,
        totalClicked: automation.totalClicked,
        createdAt: automation.createdAt.toISOString(),
        updatedAt: automation.updatedAt.toISOString(),
        location: automation.location,
        template: automation.template,
      },
      stats: {
        deliveryRate: ratioPercentage(automation.totalDelivered, automation.totalSent, 1),
        openRate: ratioPercentage(automation.totalOpened, automation.totalDelivered, 1),
        clickRate: ratioPercentage(automation.totalClicked, automation.totalDelivered, 1),
        failureRate: ratioPercentage(failedMessages, totalMessages, 1),
      },
      steps: automation.steps.map((step) => ({
        id: step.id,
        stepId: step.stepId,
        stepOrder: step.stepOrder,
        channel: step.channel,
        subject: step.subject,
        body: step.body,
        htmlBody: step.htmlBody,
        delayMinutes: step.delayMinutes,
        createdAt: step.createdAt.toISOString(),
        updatedAt: step.updatedAt.toISOString(),
      })),
      recentMessages: automation.messages.map((message) => ({
        id: message.id,
        channel: message.channel,
        direction: message.direction,
        status: message.status,
        toAddress: message.toAddress,
        toName: message.toName,
        sentAt: message.sentAt?.toISOString() || null,
        deliveredAt: message.deliveredAt?.toISOString() || null,
        openedAt: message.openedAt?.toISOString() || null,
        clickedAt: message.clickedAt?.toISOString() || null,
        failedReason: message.failedReason,
        createdAt: message.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Mobile marketing automation detail error:", error)
    return NextResponse.json({ error: "Failed to load automation detail" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> }
) {
  try {
    const auth = await resolveOwnerStudio(request)
    if ("error" in auth) {
      return auth.error
    }

    const payload = await request.json().catch(() => null)
    const action = payload?.action
    if (action !== "activate" && action !== "pause") {
      return NextResponse.json({ error: "Invalid action. Use activate or pause." }, { status: 400 })
    }

    const { automationId } = await params
    const automation = await db.automation.findFirst({
      where: {
        id: automationId,
        studioId: auth.studio.id,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    })

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 })
    }

    const transition = resolveNextStatus(automation.status, action as MobileMarketingStatusAction)
    if ("error" in transition) {
      return NextResponse.json({ error: transition.error }, { status: 400 })
    }

    if (automation.status === transition.status) {
      return NextResponse.json({
        success: true,
        automation: {
          id: automation.id,
          status: automation.status,
          updatedAt: automation.updatedAt.toISOString(),
        },
      })
    }

    const updatedAutomation = await db.automation.update({
      where: { id: automation.id },
      data: { status: transition.status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      automation: {
        id: updatedAutomation.id,
        status: updatedAutomation.status,
        updatedAt: updatedAutomation.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Mobile marketing automation status update error:", error)
    return NextResponse.json({ error: "Failed to update automation status" }, { status: 500 })
  }
}

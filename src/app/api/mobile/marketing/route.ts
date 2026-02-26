import { NextRequest, NextResponse } from "next/server"
import { AutomationTrigger, MessageChannel } from "@prisma/client"
import { fallbackAutomationStep, toPersistedStepPayload } from "@/lib/automation-chain"
import { withAutomationBodyMarkers } from "@/lib/automation-metadata"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function buildSearchWhere(search: string) {
  const normalized = search.trim()
  if (!normalized) {
    return undefined
  }

  return {
    name: { contains: normalized, mode: "insensitive" as const },
  }
}

const VALID_AUTOMATION_TRIGGERS = new Set<AutomationTrigger>([
  "WELCOME",
  "CLASS_REMINDER",
  "CLASS_FOLLOWUP",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "CLIENT_INACTIVE",
  "BIRTHDAY",
  "MEMBERSHIP_EXPIRING",
])

type OwnerStudio = {
  id: string
  name: string
  subdomain: string
  primaryColor: string | null
  currency: string | null
}

function parseChannel(input: unknown): MessageChannel | null {
  const value = String(input || "").trim().toUpperCase()
  if (value === "EMAIL" || value === "SMS") {
    return value
  }
  return null
}

function parseScheduledAt(input: unknown): Date | null {
  if (!input || typeof input !== "string") return null
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function parseTrigger(input: unknown): AutomationTrigger | null {
  const value = String(input || "").trim().toUpperCase()
  if (VALID_AUTOMATION_TRIGGERS.has(value as AutomationTrigger)) {
    return value as AutomationTrigger
  }
  return null
}

function normalizeDelayMinutes(input: unknown) {
  const parsed = Number(input)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(10080, Math.max(0, Math.round(parsed)))
}

async function resolveOwnerStudio(request: NextRequest): Promise<{ studio: OwnerStudio } | { error: NextResponse }> {
  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Missing bearer token" }, { status: 401 }) }
  }

  const decoded = verifyMobileToken(token)
  if (!decoded) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) }
  }

  if (decoded.role !== "OWNER") {
    return { error: NextResponse.json({ error: "Marketing is available for studio owner accounts only" }, { status: 403 }) }
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
    return { error: NextResponse.json({ error: "Studio not found" }, { status: 401 }) }
  }

  return {
    studio: {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveOwnerStudio(request)
    if ("error" in auth) {
      return auth.error
    }

    const studioSummary = auth.studio

    const search = String(request.nextUrl.searchParams.get("search") || "")
    const searchWhere = buildSearchWhere(search)

    const campaignWhere = {
      studioId: studioSummary.id,
      ...(searchWhere || {}),
    }

    const automationWhere = {
      studioId: studioSummary.id,
      ...(searchWhere || {}),
    }

    const [campaigns, automations, campaignCounts, automationCounts] = await Promise.all([
      db.campaign.findMany({
        where: campaignWhere,
        select: {
          id: true,
          name: true,
          channel: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          totalRecipients: true,
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          failedCount: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 20,
      }),
      db.automation.findMany({
        where: automationWhere,
        select: {
          id: true,
          name: true,
          trigger: true,
          channel: true,
          status: true,
          totalSent: true,
          totalDelivered: true,
          totalOpened: true,
          totalClicked: true,
          updatedAt: true,
          _count: {
            select: {
              steps: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 20,
      }),
      Promise.all([
        db.campaign.count({ where: { studioId: studioSummary.id } }),
        db.campaign.count({ where: { studioId: studioSummary.id, status: "SCHEDULED" } }),
        db.campaign.count({ where: { studioId: studioSummary.id, status: "SENT" } }),
      ]),
      Promise.all([
        db.automation.count({ where: { studioId: studioSummary.id } }),
        db.automation.count({ where: { studioId: studioSummary.id, status: "ACTIVE" } }),
        db.automation.count({ where: { studioId: studioSummary.id, status: "DRAFT" } }),
      ]),
    ])

    return NextResponse.json({
      role: "OWNER",
      studio: studioSummary,
      filters: {
        search,
      },
      stats: {
        campaignsTotal: campaignCounts[0],
        campaignsScheduled: campaignCounts[1],
        campaignsSent: campaignCounts[2],
        automationsTotal: automationCounts[0],
        automationsActive: automationCounts[1],
        automationsDraft: automationCounts[2],
      },
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.toISOString() : null,
        sentAt: campaign.sentAt ? campaign.sentAt.toISOString() : null,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        failedCount: campaign.failedCount,
        createdAt: campaign.createdAt.toISOString(),
      })),
      automations: automations.map((automation) => ({
        id: automation.id,
        name: automation.name,
        trigger: automation.trigger,
        channel: automation.channel,
        status: automation.status,
        totalSent: automation.totalSent,
        totalDelivered: automation.totalDelivered,
        totalOpened: automation.totalOpened,
        totalClicked: automation.totalClicked,
        stepCount: automation._count.steps,
        updatedAt: automation.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Mobile marketing error:", error)
    return NextResponse.json({ error: "Failed to load marketing" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveOwnerStudio(request)
    if ("error" in auth) {
      return auth.error
    }

    const payload = await request.json().catch(() => null)
    const action = String(payload?.action || "")

    if (action === "createCampaign") {
      const campaign = payload?.campaign || {}
      const name = String(campaign.name || "").trim()
      const channel = parseChannel(campaign.channel)
      const messageBody = String(campaign.body || "").trim()
      const subjectRaw = String(campaign.subject || "").trim()
      const subject = subjectRaw.length ? subjectRaw : null
      const scheduledAt = campaign.scheduledAt ? parseScheduledAt(campaign.scheduledAt) : null

      if (!name || !channel || !messageBody) {
        return NextResponse.json({ error: "Campaign name, channel, and body are required." }, { status: 400 })
      }

      if (campaign.scheduledAt && !scheduledAt) {
        return NextResponse.json({ error: "Invalid scheduled date." }, { status: 400 })
      }

      if (channel === "EMAIL" && !subject) {
        return NextResponse.json({ error: "Email campaigns require a subject." }, { status: 400 })
      }

      const createdCampaign = await db.campaign.create({
        data: {
          studioId: auth.studio.id,
          name,
          channel,
          subject,
          body: messageBody,
          targetAll: true,
          scheduledAt,
          status: scheduledAt ? "SCHEDULED" : "DRAFT",
        },
        select: {
          id: true,
          name: true,
          channel: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          totalRecipients: true,
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          failedCount: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        success: true,
        campaign: {
          id: createdCampaign.id,
          name: createdCampaign.name,
          channel: createdCampaign.channel,
          status: createdCampaign.status,
          scheduledAt: createdCampaign.scheduledAt ? createdCampaign.scheduledAt.toISOString() : null,
          sentAt: createdCampaign.sentAt ? createdCampaign.sentAt.toISOString() : null,
          totalRecipients: createdCampaign.totalRecipients,
          sentCount: createdCampaign.sentCount,
          deliveredCount: createdCampaign.deliveredCount,
          openedCount: createdCampaign.openedCount,
          clickedCount: createdCampaign.clickedCount,
          failedCount: createdCampaign.failedCount,
          createdAt: createdCampaign.createdAt.toISOString(),
        },
      })
    }

    if (action === "createAutomation") {
      const automation = payload?.automation || {}
      const name = String(automation.name || "").trim()
      const trigger = parseTrigger(automation.trigger)
      const channel = parseChannel(automation.channel)
      const messageBody = String(automation.body || "").trim()
      const subjectRaw = String(automation.subject || "").trim()
      const subject = subjectRaw.length ? subjectRaw : null
      const delayMinutes = normalizeDelayMinutes(automation.delayMinutes)
      const stopOnBooking = Boolean(automation.stopOnBooking)

      if (!name || !trigger || !channel || !messageBody) {
        return NextResponse.json(
          { error: "Automation name, trigger, channel, and body are required." },
          { status: 400 }
        )
      }

      if (channel === "EMAIL" && !subject) {
        return NextResponse.json({ error: "Email automations require a subject." }, { status: 400 })
      }

      const step = fallbackAutomationStep({
        channel,
        subject,
        body: messageBody,
        htmlBody: null,
        delayMinutes,
      })
      const persistedStep = toPersistedStepPayload([step])[0]

      const createdAutomation = await db.automation.create({
        data: {
          studioId: auth.studio.id,
          name,
          trigger,
          channel,
          subject,
          body: withAutomationBodyMarkers({
            body: messageBody,
            stopOnBooking,
          }),
          triggerDelay: delayMinutes,
          status: "DRAFT",
          steps: {
            create: {
              stepId: persistedStep.id,
              stepOrder: persistedStep.order,
              channel: persistedStep.channel,
              subject: persistedStep.subject,
              body: persistedStep.body,
              htmlBody: persistedStep.htmlBody,
              delayMinutes: persistedStep.delayMinutes,
            },
          },
        },
        select: {
          id: true,
          name: true,
          trigger: true,
          channel: true,
          status: true,
          totalSent: true,
          totalDelivered: true,
          totalOpened: true,
          totalClicked: true,
          updatedAt: true,
          _count: {
            select: {
              steps: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        automation: {
          id: createdAutomation.id,
          name: createdAutomation.name,
          trigger: createdAutomation.trigger,
          channel: createdAutomation.channel,
          status: createdAutomation.status,
          totalSent: createdAutomation.totalSent,
          totalDelivered: createdAutomation.totalDelivered,
          totalOpened: createdAutomation.totalOpened,
          totalClicked: createdAutomation.totalClicked,
          stepCount: createdAutomation._count.steps,
          updatedAt: createdAutomation.updatedAt.toISOString(),
        },
      })
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 })
  } catch (error) {
    console.error("Mobile marketing mutation error:", error)
    return NextResponse.json({ error: "Failed to update marketing" }, { status: 500 })
  }
}

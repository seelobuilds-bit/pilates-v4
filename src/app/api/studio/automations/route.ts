import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import {
  fallbackAutomationStep,
  getStepValidationError,
  normalizeAutomationSteps,
} from "@/lib/automation-chain"
import {
  hasStopOnBookingMarker,
  stripAutomationBodyMarkers,
  withAutomationBodyMarkers,
} from "@/lib/automation-metadata"

// GET - Fetch all automations for the studio
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId

    const automations = await db.automation.findMany({
      where: { studioId },
      orderBy: { createdAt: "desc" },
      include: {
        location: {
          select: { id: true, name: true },
        },
        template: {
          select: { id: true, name: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json({
      automations: automations.map((automation) => ({
        ...automation,
        body: stripAutomationBodyMarkers(automation.body),
        stopOnBooking: hasStopOnBookingMarker(automation.body),
      })),
    })
  } catch (error) {
    console.error("Error fetching automations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new automation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const body = await request.json()
    const {
      name, 
      trigger,
      channel, 
      subject, 
      body: messageBody, 
      htmlBody,
      triggerDelay,
      triggerDays,
      reminderHours,
      locationId,
      templateId,
      steps: rawSteps,
      stopOnBooking,
    } = body

    if (!name || !trigger) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const normalizedSteps = normalizeAutomationSteps(rawSteps)
    const fallbackStep =
      normalizedSteps.length === 0 && channel && messageBody
        ? fallbackAutomationStep({
            channel,
            subject: subject ?? null,
            body: messageBody,
            htmlBody: htmlBody ?? null,
            delayMinutes: triggerDelay || 0,
          })
        : null

    const steps = fallbackStep ? [fallbackStep] : normalizedSteps
    const stepError = getStepValidationError(steps)
    if (stepError) {
      return NextResponse.json({ error: stepError }, { status: 400 })
    }

    const createPayload = steps.map((step, index) => ({
      studioId,
      name: steps.length > 1 ? `${name} · Step ${index + 1}/${steps.length}` : name,
      trigger,
      channel: step.channel,
      subject: step.subject,
      body: withAutomationBodyMarkers({
        body: step.body,
        stopOnBooking: Boolean(stopOnBooking),
      }),
      htmlBody: step.htmlBody,
      triggerDelay: step.delayMinutes,
      triggerDays,
      reminderHours,
      locationId: locationId || null,
      templateId: templateId || null,
      status: "DRAFT" as const,
    }))

    const created = await db.$transaction(
      createPayload.map((payload) =>
        db.automation.create({
          data: payload,
          include: {
            location: true,
            template: true,
          },
        })
      )
    )

    return NextResponse.json({ automation: created[0], chainCount: created.length, chainIds: created.map((a) => a.id) })
  } catch (error) {
    console.error("Error creating automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

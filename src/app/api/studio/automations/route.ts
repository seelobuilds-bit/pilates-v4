import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import {
  fallbackAutomationStep,
  getStepValidationError,
  normalizeAutomationSteps,
  toPersistedStepPayload,
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
        steps: {
          orderBy: { stepOrder: "asc" },
          select: { id: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json({
      automations: automations.map((automation) => {
        const { steps, ...automationRecord } = automation
        return {
          ...automationRecord,
          stepCount: steps.length || 1,
          body: stripAutomationBodyMarkers(automation.body),
          stopOnBooking: hasStopOnBookingMarker(automation.body),
        }
      }),
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

    const firstStep = steps[0]
    const persistedSteps = toPersistedStepPayload(steps)

    const created = await db.automation.create({
      data: {
        studioId,
        name,
        trigger,
        channel: firstStep.channel,
        subject: firstStep.subject,
        body: withAutomationBodyMarkers({
          body: firstStep.body,
          stopOnBooking: Boolean(stopOnBooking),
        }),
        htmlBody: firstStep.htmlBody,
        triggerDelay: firstStep.delayMinutes,
        triggerDays,
        reminderHours,
        locationId: locationId || null,
        templateId: templateId || null,
        status: "DRAFT",
        steps: {
          create: persistedSteps.map((step) => ({
            stepId: step.id,
            stepOrder: step.order,
            channel: step.channel,
            subject: step.subject,
            body: step.body,
            htmlBody: step.htmlBody,
            delayMinutes: step.delayMinutes,
          })),
        },
      },
      include: {
        location: true,
        template: true,
        steps: {
          orderBy: { stepOrder: "asc" },
        },
      },
    })

    return NextResponse.json({
      automation: {
        ...created,
        steps: created.steps.map((step) => ({
          id: step.stepId,
          order: step.stepOrder,
          channel: step.channel,
          subject: step.subject,
          body: step.body,
          htmlBody: step.htmlBody,
          delayMinutes: step.delayMinutes,
        })),
        body: stripAutomationBodyMarkers(created.body),
        stopOnBooking: hasStopOnBookingMarker(created.body),
      },
      chainCount: persistedSteps.length,
      chainIds: [created.id],
    })
  } catch (error) {
    console.error("Error creating automation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

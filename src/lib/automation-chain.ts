import { MessageChannel } from "@prisma/client"

export const AUTOMATION_STEP_WINDOW_MINUTES = 30
export const MAX_AUTOMATION_STEPS = 8

export type AutomationChainStep = {
  id: string
  order: number
  channel: MessageChannel
  subject: string | null
  body: string
  htmlBody: string | null
  delayMinutes: number
}

type RawStep = Partial<{
  id: string
  order: number
  channel: string
  subject: string | null
  body: string
  htmlBody: string | null
  delayMinutes: number
}>

function toStepId(rawId: string | undefined, index: number) {
  const fallback = `step-${index + 1}`
  if (!rawId) return fallback
  const normalized = rawId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-")
  return normalized || fallback
}

function toDelayMinutes(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }
  if (value < 0) return 0
  if (value > 60 * 24 * 365) return 60 * 24 * 365
  return Math.floor(value)
}

function toChannel(value: string | undefined): MessageChannel | null {
  if (value === "EMAIL" || value === "SMS") {
    return value
  }
  return null
}

function parseRawSteps(raw: unknown): RawStep[] {
  return Array.isArray(raw) ? (raw as RawStep[]) : []
}

export function normalizeAutomationSteps(raw: unknown): AutomationChainStep[] {
  const parsed = parseRawSteps(raw)
  const normalized: AutomationChainStep[] = []

  for (let index = 0; index < parsed.length && normalized.length < MAX_AUTOMATION_STEPS; index += 1) {
    const step = parsed[index]
    const channel = toChannel(step.channel)
    const body = step.body?.trim() || ""

    if (!channel || !body) {
      continue
    }

    const subject = channel === "EMAIL" ? step.subject?.trim() || null : null

    normalized.push({
      id: toStepId(step.id, index),
      order: typeof step.order === "number" ? step.order : index,
      channel,
      subject,
      body,
      htmlBody: step.htmlBody?.trim() || null,
      delayMinutes: toDelayMinutes(step.delayMinutes),
    })
  }

  normalized.sort((a, b) => a.order - b.order)
  return normalized.map((step, index) => ({ ...step, order: index }))
}

export function getStepValidationError(steps: AutomationChainStep[]): string | null {
  if (steps.length === 0) {
    return "At least one automation step is required"
  }

  if (steps.length > MAX_AUTOMATION_STEPS) {
    return `You can add up to ${MAX_AUTOMATION_STEPS} steps`
  }

  for (const step of steps) {
    if (!step.body.trim()) {
      return "Each step needs message content"
    }
    if (step.channel === "EMAIL" && !step.subject?.trim()) {
      return "Email steps require a subject"
    }
    if (step.delayMinutes < 0) {
      return "Step delay cannot be negative"
    }
  }

  return null
}

export function fallbackAutomationStep(input: {
  channel: MessageChannel
  subject: string | null
  body: string
  htmlBody: string | null
  delayMinutes: number
}): AutomationChainStep {
  return {
    id: "step-1",
    order: 0,
    channel: input.channel,
    subject: input.channel === "EMAIL" ? input.subject : null,
    body: input.body,
    htmlBody: input.htmlBody,
    delayMinutes: toDelayMinutes(input.delayMinutes),
  }
}

export function toPersistedStepPayload(steps: AutomationChainStep[]) {
  return steps.map((step) => ({
    id: step.id,
    order: step.order,
    channel: step.channel,
    subject: step.subject,
    body: step.body,
    htmlBody: step.htmlBody,
    delayMinutes: step.delayMinutes,
  }))
}

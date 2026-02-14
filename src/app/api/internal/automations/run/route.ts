import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendStudioEmail } from "@/lib/email"
import { sendSMS } from "@/lib/communications"
import { Automation, AutomationTrigger, Client, MessageChannel } from "@prisma/client"

function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_full, key: string) => vars[key] ?? "")
}

function toDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function toTimeLabel(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

async function sendAutomationMessage(params: {
  automation: Automation
  studioName: string
  client: Client
  idempotencyKey: string
  vars: Record<string, string>
}) {
  const { automation, studioName, client, idempotencyKey, vars } = params

  const existing = await db.message.findFirst({
    where: {
      studioId: automation.studioId,
      automationId: automation.id,
      threadId: idempotencyKey,
    },
    select: { id: true },
  })

  if (existing) {
    return { sent: false, reason: "duplicate" as const }
  }

  const renderedSubject = automation.subject ? renderTemplate(automation.subject, vars) : null
  const renderedBody = renderTemplate(automation.body, vars)
  const renderedHtmlBody = automation.htmlBody ? renderTemplate(automation.htmlBody, vars) : null

  const targetEmail = client.email?.trim()
  const targetPhone = client.phone?.trim()

  if (automation.channel === "EMAIL" && !targetEmail) {
    return { sent: false, reason: "no_email" as const }
  }
  if (automation.channel === "SMS" && !targetPhone) {
    return { sent: false, reason: "no_phone" as const }
  }

  const queued = await db.message.create({
    data: {
      channel: automation.channel,
      direction: "OUTBOUND",
      status: "QUEUED",
      subject: renderedSubject,
      body: renderedBody,
      htmlBody: renderedHtmlBody,
      fromAddress: automation.channel === "EMAIL" ? `automation@${automation.studioId}.local` : "automation",
      toAddress: automation.channel === "EMAIL" ? targetEmail! : targetPhone!,
      fromName: `${studioName} Automations`,
      toName: `${client.firstName} ${client.lastName}`.trim(),
      threadId: idempotencyKey,
      studioId: automation.studioId,
      clientId: client.id,
      automationId: automation.id,
    },
  })

  if (automation.channel === "EMAIL") {
    const emailResult = await sendStudioEmail(automation.studioId, {
      to: targetEmail!,
      subject: renderedSubject || automation.name,
      html: renderedHtmlBody || `<p>${renderedBody.replace(/\n/g, "<br>")}</p>`,
      text: renderedBody,
    })

    if (!emailResult.success) {
      await db.message.update({
        where: { id: queued.id },
        data: {
          status: "FAILED",
          failedReason: emailResult.error || "Email send failed",
        },
      })
      return { sent: false, reason: "send_failed" as const }
    }

    await db.message.update({
      where: { id: queued.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId: emailResult.messageId || null,
      },
    })
  }

  if (automation.channel === "SMS") {
    const smsResult = await sendSMS({
      to: targetPhone!,
      body: renderedBody,
    })

    if (!smsResult.success) {
      await db.message.update({
        where: { id: queued.id },
        data: {
          status: "FAILED",
          failedReason: smsResult.error || "SMS send failed",
        },
      })
      return { sent: false, reason: "send_failed" as const }
    }

    await db.message.update({
      where: { id: queued.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId: smsResult.messageId || null,
      },
    })
  }

  await db.automation.update({
    where: { id: automation.id },
    data: {
      totalSent: { increment: 1 },
      totalDelivered: { increment: 1 },
    },
  })

  return { sent: true, reason: "ok" as const }
}

type Candidate = {
  client: Client
  vars: Record<string, string>
  idempotencyKey: string
}

async function getCandidates(
  automation: Automation,
  now: Date
): Promise<Candidate[]> {
  const studioId = automation.studioId
  const defaultVars = { studioName: "" }

  if (automation.trigger === "WELCOME") {
    const clients = await db.client.findMany({
      where: {
        studioId,
        createdAt: {
          gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
        },
      },
    })

    return clients.map((client) => ({
      client,
      vars: {
        ...defaultVars,
        firstName: client.firstName,
        lastName: client.lastName,
      },
      idempotencyKey: `automation:${automation.id}:welcome:${client.id}`,
    }))
  }

  if (automation.trigger === "BOOKING_CONFIRMED") {
    const bookings = await db.booking.findMany({
      where: {
        studioId,
        status: "CONFIRMED",
        createdAt: {
          gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
        },
      },
      include: {
        client: true,
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
    })

    return bookings
      .filter((booking) => !automation.locationId || booking.classSession.locationId === automation.locationId)
      .map((booking) => ({
        client: booking.client,
        vars: {
          ...defaultVars,
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          className: booking.classSession.classType.name,
          classDate: toDateLabel(new Date(booking.classSession.startTime)),
          classTime: toTimeLabel(new Date(booking.classSession.startTime)),
          locationName: booking.classSession.location.name,
          teacherName: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        },
        idempotencyKey: `automation:${automation.id}:booking_confirmed:${booking.id}`,
      }))
  }

  if (automation.trigger === "BOOKING_CANCELLED") {
    const bookings = await db.booking.findMany({
      where: {
        studioId,
        status: "CANCELLED",
        cancelledAt: {
          not: null,
          gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
        },
      },
      include: {
        client: true,
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
    })

    return bookings
      .filter((booking) => !automation.locationId || booking.classSession.locationId === automation.locationId)
      .map((booking) => ({
        client: booking.client,
        vars: {
          ...defaultVars,
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          className: booking.classSession.classType.name,
          classDate: toDateLabel(new Date(booking.classSession.startTime)),
          classTime: toTimeLabel(new Date(booking.classSession.startTime)),
          locationName: booking.classSession.location.name,
          teacherName: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        },
        idempotencyKey: `automation:${automation.id}:booking_cancelled:${booking.id}`,
      }))
  }

  if (automation.trigger === "CLASS_REMINDER") {
    const reminderHours = automation.reminderHours ?? 24
    const bookings = await db.booking.findMany({
      where: {
        studioId,
        status: "CONFIRMED",
        classSession: {
          startTime: {
            gte: now,
            lte: new Date(now.getTime() + 1000 * 60 * 60 * 72),
          },
        },
      },
      include: {
        client: true,
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
    })

    return bookings
      .filter((booking) => !automation.locationId || booking.classSession.locationId === automation.locationId)
      .filter((booking) => {
        const classStart = new Date(booking.classSession.startTime).getTime()
        const reminderAt = classStart - reminderHours * 60 * 60 * 1000
        return now.getTime() >= reminderAt && now.getTime() < reminderAt + 30 * 60 * 1000
      })
      .map((booking) => ({
        client: booking.client,
        vars: {
          ...defaultVars,
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          className: booking.classSession.classType.name,
          classDate: toDateLabel(new Date(booking.classSession.startTime)),
          classTime: toTimeLabel(new Date(booking.classSession.startTime)),
          locationName: booking.classSession.location.name,
          teacherName: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        },
        idempotencyKey: `automation:${automation.id}:class_reminder:${booking.id}:${reminderHours}`,
      }))
  }

  if (automation.trigger === "CLASS_FOLLOWUP") {
    const followUpDelayMinutes = automation.triggerDelay || 60
    const bookings = await db.booking.findMany({
      where: {
        studioId,
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
        classSession: {
          endTime: {
            lte: now,
          },
        },
      },
      include: {
        client: true,
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true,
          },
        },
      },
    })

    return bookings
      .filter((booking) => !automation.locationId || booking.classSession.locationId === automation.locationId)
      .filter((booking) => {
        const followupAt = new Date(booking.classSession.endTime).getTime() + followUpDelayMinutes * 60 * 1000
        return now.getTime() >= followupAt && now.getTime() < followupAt + 30 * 60 * 1000
      })
      .map((booking) => ({
        client: booking.client,
        vars: {
          ...defaultVars,
          firstName: booking.client.firstName,
          lastName: booking.client.lastName,
          className: booking.classSession.classType.name,
          classDate: toDateLabel(new Date(booking.classSession.startTime)),
          classTime: toTimeLabel(new Date(booking.classSession.startTime)),
          locationName: booking.classSession.location.name,
          teacherName: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        },
        idempotencyKey: `automation:${automation.id}:class_followup:${booking.id}:${followUpDelayMinutes}`,
      }))
  }

  if (automation.trigger === "CLIENT_INACTIVE") {
    const inactiveDays = automation.triggerDays ?? 30
    const cutoff = new Date(now.getTime() - inactiveDays * 24 * 60 * 60 * 1000)

    const clients = await db.client.findMany({
      where: {
        studioId,
        bookings: {
          none: {
            createdAt: {
              gte: cutoff,
            },
          },
        },
      },
    })

    const bucket = cutoff.toISOString().slice(0, 10)
    return clients.map((client) => ({
      client,
      vars: {
        ...defaultVars,
        firstName: client.firstName,
        lastName: client.lastName,
      },
      idempotencyKey: `automation:${automation.id}:client_inactive:${client.id}:${bucket}`,
    }))
  }

  if (automation.trigger === "BIRTHDAY") {
    const clients = await db.client.findMany({
      where: {
        studioId,
        birthday: {
          not: null,
        },
      },
    })

    const month = now.getMonth()
    const day = now.getDate()
    const year = now.getFullYear()

    return clients
      .filter((client) => {
        if (!client.birthday) return false
        const birthday = new Date(client.birthday)
        return birthday.getMonth() === month && birthday.getDate() === day
      })
      .map((client) => ({
        client,
        vars: {
          ...defaultVars,
          firstName: client.firstName,
          lastName: client.lastName,
        },
        idempotencyKey: `automation:${automation.id}:birthday:${client.id}:${year}`,
      }))
  }

  if (automation.trigger === "MEMBERSHIP_EXPIRING") {
    const days = automation.triggerDays ?? 7
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const subscriptions = await db.vaultSubscriber.findMany({
      where: {
        plan: { studioId },
        status: { in: ["active", "cancelled"] },
        clientId: { not: null },
        currentPeriodEnd: {
          gte: now,
          lte: end,
        },
      },
      include: {
        client: true,
      },
    })

    return subscriptions
      .filter((subscription) => subscription.client)
      .map((subscription) => ({
        client: subscription.client as Client,
        vars: {
          ...defaultVars,
          firstName: subscription.client?.firstName || "",
          lastName: subscription.client?.lastName || "",
          membershipEndDate: toDateLabel(new Date(subscription.currentPeriodEnd)),
        },
        idempotencyKey: `automation:${automation.id}:membership_expiring:${subscription.id}:${subscription.currentPeriodEnd.toISOString().slice(0, 10)}`,
      }))
  }

  return []
}

export async function POST(request: NextRequest) {
  const secret = process.env.AUTOMATION_WORKER_SECRET
  if (!secret) {
    return NextResponse.json({ error: "AUTOMATION_WORKER_SECRET is not configured" }, { status: 500 })
  }

  const incoming = request.headers.get("x-automation-secret")
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const activeAutomations = await db.automation.findMany({
      where: { status: "ACTIVE" },
      include: {
        studio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const summary: Array<{
      automationId: string
      trigger: AutomationTrigger
      channel: MessageChannel
      processed: number
      sent: number
      skipped: number
    }> = []

    for (const automation of activeAutomations) {
      const candidates = await getCandidates(automation, now)
      let sent = 0
      let skipped = 0

      for (const candidate of candidates) {
        const result = await sendAutomationMessage({
          automation,
          studioName: automation.studio.name,
          client: candidate.client,
          idempotencyKey: candidate.idempotencyKey,
          vars: {
            ...candidate.vars,
            studioName: automation.studio.name,
          },
        })

        if (result.sent) {
          sent += 1
        } else {
          skipped += 1
        }
      }

      summary.push({
        automationId: automation.id,
        trigger: automation.trigger,
        channel: automation.channel,
        processed: candidates.length,
        sent,
        skipped,
      })
    }

    return NextResponse.json({
      ok: true,
      ranAt: now.toISOString(),
      totalAutomations: activeAutomations.length,
      summary,
    })
  } catch (error) {
    console.error("Automation worker failed:", error)
    return NextResponse.json({ error: "Automation worker failed" }, { status: 500 })
  }
}

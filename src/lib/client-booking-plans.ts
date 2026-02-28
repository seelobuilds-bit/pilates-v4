import { db } from "@/lib/db"
import { calculatePlatformFee, getStripe } from "@/lib/stripe"

type UpsertPackPlanInput = {
  studioId: string
  clientId: string
  classTypeName: string
  teacherName: string
  locationName: string
  creditsPerRenewal: number
  pricePerCycle: number
  currency: string
  stripePaymentMethodId: string
}

type UpsertWeeklyPlanInput = {
  studioId: string
  clientId: string
  classTypeName: string
  teacherName: string
  locationName: string
  pricePerCycle: number
  currency: string
  stripeSubscriptionId: string
  nextChargeAt: Date | null
}

export async function upsertClientPackAutoRenewPlan(input: UpsertPackPlanInput) {
  const existing = await db.clientBookingPlan.findFirst({
    where: {
      studioId: input.studioId,
      clientId: input.clientId,
      kind: "PACK",
    },
    select: { id: true },
  })

  const payload = {
    status: "active",
    title: `${input.creditsPerRenewal} Class Pack`,
    description: `Books this class now, then adds ${input.creditsPerRenewal} credits whenever your last credit is used.`,
    autoRenew: true,
    creditsPerRenewal: input.creditsPerRenewal,
    pricePerCycle: input.pricePerCycle,
    currency: input.currency,
    nextChargeAt: null,
    stripePaymentMethodId: input.stripePaymentMethodId,
    classTypeName: input.classTypeName,
    teacherName: input.teacherName,
    locationName: input.locationName,
    lastRenewedAt: new Date(),
    cancelledAt: null,
  }

  if (existing) {
    return db.clientBookingPlan.update({
      where: { id: existing.id },
      data: payload,
    })
  }

  return db.clientBookingPlan.create({
    data: {
      studioId: input.studioId,
      clientId: input.clientId,
      kind: "PACK",
      ...payload,
    },
  })
}

export async function upsertClientWeeklyBookingPlan(input: UpsertWeeklyPlanInput) {
  const payload = {
    status: "active",
    title: "Weekly Subscription",
    description: `Same ${input.classTypeName} slot every week.`,
    autoRenew: true,
    creditsPerRenewal: null,
    pricePerCycle: input.pricePerCycle,
    currency: input.currency,
    nextChargeAt: input.nextChargeAt,
    stripeSubscriptionId: input.stripeSubscriptionId,
    stripePaymentMethodId: null,
    classTypeName: input.classTypeName,
    teacherName: input.teacherName,
    locationName: input.locationName,
    lastRenewedAt: new Date(),
    cancelledAt: null,
  }

  const existing = await db.clientBookingPlan.findFirst({
    where: {
      studioId: input.studioId,
      clientId: input.clientId,
      stripeSubscriptionId: input.stripeSubscriptionId,
    },
    select: { id: true },
  })

  if (existing) {
    return db.clientBookingPlan.update({
      where: { id: existing.id },
      data: payload,
    })
  }

  return db.clientBookingPlan.create({
    data: {
      studioId: input.studioId,
      clientId: input.clientId,
      kind: "WEEKLY",
      ...payload,
    },
  })
}

export async function triggerClientPackAutoRenew(planId: string) {
  const plan = await db.clientBookingPlan.findFirst({
    where: {
      id: planId,
      kind: "PACK",
      status: "active",
      autoRenew: true,
    },
    include: {
      client: {
        select: {
          id: true,
          credits: true,
          stripeCustomerId: true,
        },
      },
      studio: {
        select: {
          id: true,
          stripeAccountId: true,
          stripeChargesEnabled: true,
        },
      },
    },
  })

  if (!plan) return { renewed: false, reason: "plan_missing" as const }
  if (plan.client.credits > 0) return { renewed: false, reason: "credits_remaining" as const }
  if (!plan.studio.stripeAccountId || !plan.studio.stripeChargesEnabled) return { renewed: false, reason: "stripe_unavailable" as const }
  if (!plan.client.stripeCustomerId || !plan.stripePaymentMethodId || !plan.pricePerCycle || !plan.creditsPerRenewal) {
    return { renewed: false, reason: "payment_details_missing" as const }
  }

  const stripe = getStripe()
  const amountInCents = Math.round(plan.pricePerCycle * 100)
  const applicationFee = calculatePlatformFee(amountInCents)

  const payment = await db.payment.create({
    data: {
      amount: amountInCents,
      currency: plan.currency || "usd",
      status: "PENDING",
      description: `${plan.title} auto-renew`,
      applicationFee,
      studioId: plan.studioId,
      clientId: plan.clientId,
    },
  })

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: plan.currency || "usd",
        customer: plan.client.stripeCustomerId,
        payment_method: plan.stripePaymentMethodId,
        confirm: true,
        off_session: true,
        application_fee_amount: applicationFee,
        metadata: {
          type: "class_pack_auto_renew",
          clientId: plan.clientId,
          studioId: plan.studioId,
          bookingPlanId: plan.id,
          creditsPurchased: String(plan.creditsPerRenewal),
        },
      },
      {
        stripeAccount: plan.studio.stripeAccountId,
      }
    )

    if (paymentIntent.status !== "succeeded") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          stripePaymentIntentId: paymentIntent.id,
          failureMessage: `Auto-renew requires action (${paymentIntent.status})`,
        },
      })
      return { renewed: false, reason: "requires_action" as const }
    }

    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : null,
        },
      }),
      db.client.update({
        where: { id: plan.clientId },
        data: {
          credits: {
            increment: plan.creditsPerRenewal,
          },
        },
      }),
      db.clientBookingPlan.update({
        where: { id: plan.id },
        data: {
          lastRenewedAt: new Date(),
          cancelledAt: null,
          status: "active",
        },
      }),
    ])

    return { renewed: true, reason: "succeeded" as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auto-renew failed"
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureMessage: message,
      },
    })
    return { renewed: false, reason: "failed" as const, message }
  }
}

export async function cancelClientBookingPlan(input: {
  planId: string
  clientId: string
  studioId: string
}) {
  const bookingPlan = await db.clientBookingPlan.findFirst({
    where: {
      id: input.planId,
      clientId: input.clientId,
      studioId: input.studioId,
    },
    include: {
      studio: {
        select: {
          stripeAccountId: true,
        },
      },
    },
  })

  if (!bookingPlan) {
    return { ok: false as const, code: "not_found" as const }
  }

  if (bookingPlan.status === "cancelled") {
    return {
      ok: true as const,
      alreadyCancelled: true as const,
      accessUntil: bookingPlan.nextChargeAt,
      message: "This plan is already cancelled.",
    }
  }

  let accessUntil = bookingPlan.nextChargeAt
  if (bookingPlan.kind === "WEEKLY" && bookingPlan.stripeSubscriptionId && bookingPlan.studio.stripeAccountId) {
    const stripe = getStripe()
    const updated = await stripe.subscriptions.update(
      bookingPlan.stripeSubscriptionId,
      { cancel_at_period_end: true },
      { stripeAccount: bookingPlan.studio.stripeAccountId }
    )
    const updatedPeriodEnd = (updated as { current_period_end?: number }).current_period_end
    accessUntil =
      typeof updatedPeriodEnd === "number"
        ? new Date(updatedPeriodEnd * 1000)
        : accessUntil
  }

  await db.clientBookingPlan.update({
    where: { id: bookingPlan.id },
    data: {
      status: "cancelled",
      autoRenew: false,
      cancelledAt: new Date(),
      nextChargeAt: accessUntil,
    },
  })

  return {
    ok: true as const,
    alreadyCancelled: false as const,
    accessUntil,
    message:
      bookingPlan.kind === "WEEKLY"
        ? "Weekly subscription will cancel at the end of the current billing period."
        : "Class pack auto-renew has been cancelled. Your remaining credits stay on your account.",
  }
}

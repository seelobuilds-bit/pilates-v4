import Stripe from "stripe"
import { db } from "@/lib/db"

type ConnectedCustomerInput = {
  stripe: Stripe
  stripeAccountId: string
  client: {
    id: string
    email: string
    firstName: string
    lastName: string
    studioId: string
    stripeCustomerId: string | null
  }
}

function isMissingCustomerError(error: unknown) {
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return error.code === "resource_missing"
  }
  return false
}

export async function ensureStripeCustomerForConnectedAccount({
  stripe,
  stripeAccountId,
  client,
}: ConnectedCustomerInput) {
  let stripeCustomerId = client.stripeCustomerId

  if (stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(stripeCustomerId, {
        stripeAccount: stripeAccountId,
      })

      if (existing && !("deleted" in existing && existing.deleted)) {
        return stripeCustomerId
      }
    } catch (error) {
      if (!isMissingCustomerError(error)) {
        throw error
      }
      stripeCustomerId = null
    }
  }

  const customer = await stripe.customers.create(
    {
      email: client.email,
      name: `${client.firstName} ${client.lastName}`,
      metadata: {
        clientId: client.id,
        studioId: client.studioId,
      },
    },
    {
      stripeAccount: stripeAccountId,
    }
  )

  stripeCustomerId = customer.id

  await db.client.update({
    where: { id: client.id },
    data: { stripeCustomerId },
  })

  return stripeCustomerId
}

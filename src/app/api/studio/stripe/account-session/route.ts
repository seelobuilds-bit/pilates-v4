import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"

// POST - Create an account session for embedded components
export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ 
        error: "Stripe is not configured" 
      }, { status: 500 })
    }

    const auth = await requireOwnerStudioAccess()
    if ("error" in auth) {
      return auth.error
    }
    const studioId = auth.studioId

    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: { stripeAccountId: true },
    })

    if (!studio?.stripeAccountId) {
      return NextResponse.json({ 
        error: "No Stripe account connected" 
      }, { status: 400 })
    }

    const stripe = getStripe()

    // Create an account session for embedded components
    const accountSession = await stripe.accountSessions.create({
      account: studio.stripeAccountId,
      components: {
        payments: { enabled: true },
        payouts: { enabled: true },
        balances: { enabled: true },
        notification_banner: { enabled: true },
      },
    })

    return NextResponse.json({ 
      clientSecret: accountSession.client_secret 
    })
  } catch (error) {
    console.error("Error creating account session:", error)
    return NextResponse.json({ 
      error: "Failed to create account session" 
    }, { status: 500 })
  }
}

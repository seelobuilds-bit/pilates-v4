import { NextResponse } from "next/server"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const debug: Record<string, unknown> = {
    stripeConfigured: isStripeConfigured(),
    hasSession: !!session,
    hasStudioId: !!session?.user?.studioId,
  }
  
  if (session?.user?.studioId) {
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId },
      select: { 
        id: true, 
        name: true, 
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        owner: { select: { email: true } }
      }
    })
    debug.studio = studio
  }
  
  if (isStripeConfigured()) {
    try {
      const stripe = getStripe()
      // Try a simple API call to verify the key works
      const balance = await stripe.balance.retrieve()
      debug.stripeKeyValid = true
      debug.stripeMode = balance.livemode ? "live" : "test"
    } catch (error: unknown) {
      const stripeError = error as {
        message?: string
        type?: string
        code?: string
      }
      debug.stripeKeyValid = false
      debug.stripeError = stripeError.message || "Unknown error"
      debug.stripeErrorType = stripeError.type
      debug.stripeErrorCode = stripeError.code
    }
  }
  
  return NextResponse.json(debug)
}

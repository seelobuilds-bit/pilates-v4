import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getStripe, isStripeConfigured } from "@/lib/stripe"

// POST - Create Stripe Connect account and get onboarding link
export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ 
        error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment." 
      }, { status: 500 })
    }

    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId
    const stripe = getStripe()

    // Get studio
    const studio = await db.studio.findUnique({
      where: { id: studioId },
      include: { owner: true },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    let stripeAccountId = studio.stripeAccountId

    // Create Stripe Connect account if doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express", // Express accounts for embedded components
        email: studio.owner.email,
        metadata: {
          studioId: studio.id,
          studioName: studio.name,
        },
        business_profile: {
          name: studio.name,
          product_description: "Pilates and fitness studio",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      stripeAccountId = account.id

      // Save the account ID
      await db.studio.update({
        where: { id: studioId },
        data: { stripeAccountId },
      })
    }

    // Create account link for onboarding
    // Use NEXTAUTH_URL or fallback to production URL
    let baseUrl = process.env.NEXTAUTH_URL || "https://thecurrent.app"
    
    // Clean up any newlines or whitespace that might have gotten into the env var
    baseUrl = baseUrl.trim().replace(/\\n/g, '').replace(/\n/g, '')
    
    // Ensure it's a valid URL
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }
    
    console.log("Creating account link with baseUrl:", baseUrl)
    
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/studio/settings?stripe=refresh`,
        return_url: `${baseUrl}/studio/settings?stripe=success`,
        type: "account_onboarding",
      })

      return NextResponse.json({ 
        url: accountLink.url,
        accountId: stripeAccountId,
      })
    } catch (linkError: any) {
      console.error("Error creating account link:", linkError)
      return NextResponse.json({ 
        error: `Failed to create onboarding link: ${linkError?.message || 'Unknown error'}`,
        code: linkError?.code,
        accountId: stripeAccountId,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error)
    // Return more detailed error for debugging
    const errorMessage = error?.message || error?.raw?.message || "Failed to create Stripe account"
    return NextResponse.json({ 
      error: errorMessage,
      code: error?.code || error?.raw?.code,
      type: error?.type || error?.raw?.type
    }, { status: 500 })
  }
}

// GET - Get Stripe account status
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If Stripe is not configured, return not configured status
    if (!isStripeConfigured()) {
      return NextResponse.json({
        connected: false,
        configured: false,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        onboardingComplete: false,
      })
    }

    const studioId = session.user.studioId

    const studio = await db.studio.findUnique({
      where: { id: studioId },
      select: {
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        stripeDetailsSubmitted: true,
        stripeCurrency: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // If no Stripe account, return disconnected status
    if (!studio.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        configured: true,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        onboardingComplete: false,
      })
    }

    // Fetch latest status from Stripe
    try {
      const stripe = getStripe()
      const account = await stripe.accounts.retrieve(studio.stripeAccountId)
      
      // Update local database with latest status
      await db.studio.update({
        where: { id: studioId },
        data: {
          stripeChargesEnabled: account.charges_enabled,
          stripePayoutsEnabled: account.payouts_enabled,
          stripeDetailsSubmitted: account.details_submitted,
          stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
          stripeCurrency: account.default_currency || "usd",
        },
      })

      return NextResponse.json({
        connected: true,
        configured: true,
        accountId: studio.stripeAccountId,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: account.charges_enabled && account.payouts_enabled,
        currency: account.default_currency,
        email: account.email,
        businessName: account.business_profile?.name,
      })
    } catch (stripeError) {
      console.error("Error fetching Stripe account:", stripeError)
      // Account might have been deleted
      return NextResponse.json({
        connected: false,
        configured: true,
        accountId: studio.stripeAccountId,
        error: "Unable to fetch Stripe account status",
      })
    }
  } catch (error) {
    console.error("Error getting Stripe status:", error)
    return NextResponse.json({ error: "Failed to get Stripe status" }, { status: 500 })
  }
}

// DELETE - Disconnect Stripe account
export async function DELETE() {
  try {
    const session = await getSession()
    
    if (!session?.user?.studioId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = session.user.studioId

    // Clear Stripe data (note: we don't delete the Stripe account itself)
    await db.studio.update({
      where: { id: studioId },
      data: {
        stripeAccountId: null,
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting Stripe:", error)
    return NextResponse.json({ error: "Failed to disconnect Stripe" }, { status: 500 })
  }
}

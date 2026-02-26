import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe, calculatePlatformFee } from "@/lib/stripe"
import { normalizeSocialTrackingCode } from "@/lib/social-tracking"
import { ensureStripeCustomerForConnectedAccount } from "@/lib/stripe-customers"

// POST - Create a checkout session for booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { classSessionId, clientEmail, clientFirstName, clientLastName, trackingCode } = body

    // Get studio
    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        stripeCurrency: true,
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    if (!studio.stripeAccountId || !studio.stripeChargesEnabled) {
      return NextResponse.json({ 
        error: "This studio has not set up payments yet" 
      }, { status: 400 })
    }

    const stripe = getStripe()

    // Get class session
    const classSession = await db.classSession.findFirst({
      where: { id: classSessionId, studioId: studio.id },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
      },
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (new Date(classSession.startTime) < new Date()) {
      return NextResponse.json({ error: "This class has already started" }, { status: 400 })
    }

    // Check capacity
    const activeBookingsCount = await db.booking.count({
      where: {
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    })

    if (activeBookingsCount >= classSession.capacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 })
    }

    // Get or create client
    let client = await db.client.findFirst({
      where: { 
        email: clientEmail, 
        studioId: studio.id 
      },
    })

    if (!client) {
      client = await db.client.create({
        data: {
          email: clientEmail,
          firstName: clientFirstName,
          lastName: clientLastName,
          studioId: studio.id,
        },
      })
    }

    const existingBooking = await db.booking.findFirst({
      where: {
        clientId: client.id,
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { id: true },
    })

    if (existingBooking) {
      return NextResponse.json({ error: "You have already booked this class" }, { status: 400 })
    }

    const stripeCustomerId = await ensureStripeCustomerForConnectedAccount({
      stripe,
      stripeAccountId: studio.stripeAccountId,
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        studioId: studio.id,
        stripeCustomerId: client.stripeCustomerId,
      },
    })

    // Calculate amounts (price is stored in dollars, Stripe needs cents)
    const amountInCents = Math.round(classSession.classType.price * 100)
    const platformFee = calculatePlatformFee(amountInCents)

    const normalizedTrackingCode = normalizeSocialTrackingCode(trackingCode)
    let attributedTrackingCode: string | null = null
    if (normalizedTrackingCode) {
      const trackingLink = await db.socialMediaTrackingLink.findFirst({
        where: {
          code: normalizedTrackingCode,
          studioId: studio.id
        },
        select: {
          id: true
        }
      })
      if (trackingLink) {
        attributedTrackingCode = normalizedTrackingCode
      }
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: studio.stripeCurrency || "usd",
            product_data: {
              name: classSession.classType.name,
              description: `${new Date(classSession.startTime).toLocaleDateString()} at ${new Date(classSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with ${classSession.teacher.user.firstName} ${classSession.teacher.user.lastName}`,
              metadata: {
                classTypeId: classSession.classType.id,
                classSessionId: classSession.id,
              },
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        metadata: {
          clientId: client.id,
          studioId: studio.id,
          classSessionId: classSession.id,
          ...(attributedTrackingCode ? { trackingCode: attributedTrackingCode } : {}),
        },
      },
      success_url: `${baseUrl}/${subdomain}/book?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${subdomain}/book?canceled=true`,
      metadata: {
        clientId: client.id,
        studioId: studio.id,
        classSessionId: classSession.id,
        ...(attributedTrackingCode ? { trackingCode: attributedTrackingCode } : {}),
      },
    }, {
      stripeAccount: studio.stripeAccountId,
    })

    // Create pending payment record
    await db.payment.create({
      data: {
        amount: amountInCents,
        currency: studio.stripeCurrency || "usd",
        status: "PENDING",
        stripeCheckoutSessionId: checkoutSession.id,
        description: `${classSession.classType.name} - ${new Date(classSession.startTime).toLocaleDateString()}`,
        studioId: studio.id,
        clientId: client.id,
      },
    })

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

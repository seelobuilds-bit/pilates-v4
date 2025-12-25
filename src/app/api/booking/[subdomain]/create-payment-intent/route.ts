import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe, calculatePlatformFee } from "@/lib/stripe"

// POST - Create a PaymentIntent for embedded payment form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { classSessionId, clientEmail, clientFirstName, clientLastName } = body

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
    const classSession = await db.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        classType: true,
        teacher: { include: { user: true } },
        location: true,
        _count: { select: { bookings: true } },
      },
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check capacity
    if (classSession._count.bookings >= classSession.capacity) {
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

    // Create or get Stripe customer on the connected account
    let stripeCustomerId = client.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: clientEmail,
        name: `${clientFirstName} ${clientLastName}`,
        metadata: {
          clientId: client.id,
          studioId: studio.id,
        },
      }, {
        stripeAccount: studio.stripeAccountId,
      })

      stripeCustomerId = customer.id

      await db.client.update({
        where: { id: client.id },
        data: { stripeCustomerId },
      })
    }

    // Calculate amounts (price is stored in dollars, Stripe needs cents)
    const amountInCents = Math.round(classSession.classType.price * 100)
    const platformFee = calculatePlatformFee(amountInCents)

    // Create PaymentIntent on the connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: studio.stripeCurrency || "usd",
      customer: stripeCustomerId,
      application_fee_amount: platformFee,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        clientId: client.id,
        studioId: studio.id,
        classSessionId: classSession.id,
        className: classSession.classType.name,
        classDate: new Date(classSession.startTime).toISOString(),
        teacherName: `${classSession.teacher.user.firstName} ${classSession.teacher.user.lastName}`,
        locationName: classSession.location.name,
      },
    }, {
      stripeAccount: studio.stripeAccountId,
    })

    // Create pending payment record
    const payment = await db.payment.create({
      data: {
        amount: amountInCents,
        currency: studio.stripeCurrency || "usd",
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        description: `${classSession.classType.name} - ${new Date(classSession.startTime).toLocaleDateString()}`,
        studioId: studio.id,
        clientId: client.id,
      },
    })

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      connectedAccountId: studio.stripeAccountId,
      amount: amountInCents,
      currency: studio.stripeCurrency || "usd",
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}















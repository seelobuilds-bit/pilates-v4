import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getStripe, calculatePlatformFee } from "@/lib/stripe"
import { normalizeSocialTrackingCode } from "@/lib/social-tracking"

// POST - Create a PaymentIntent for embedded payment form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const {
      classSessionId,
      clientEmail,
      clientFirstName,
      clientLastName,
      trackingCode,
      bookingType: rawBookingType,
      packSize: rawPackSize,
      autoRenew: rawAutoRenew,
    } = body

    const bookingType: "single" | "recurring" | "pack" =
      rawBookingType === "recurring" || rawBookingType === "pack" ? rawBookingType : "single"
    const packSize = Number(rawPackSize)
    const normalizedPackSize = [5, 10, 20].includes(packSize) ? packSize : 5
    const autoRenew = rawAutoRenew === true

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

    // Check if class has started
    if (new Date(classSession.startTime) < new Date()) {
      return NextResponse.json({ error: "This class has already started" }, { status: 400 })
    }

    // Check capacity (active bookings only)
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

    // Check if client already has an active booking for this class
    const existingBooking = await db.booking.findFirst({
      where: {
        clientId: client.id,
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] }
      }
    })

    if (existingBooking) {
      return NextResponse.json({ 
        error: "You have already booked this class" 
      }, { status: 400 })
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
    let creditsPurchased = 1
    let discountRate = 0
    if (bookingType === "recurring") {
      creditsPurchased = 4
      discountRate = 0.15
    } else if (bookingType === "pack") {
      creditsPurchased = normalizedPackSize
      discountRate = normalizedPackSize === 5 ? 0.1 : normalizedPackSize === 10 ? 0.2 : 0.25
    }
    const totalDollars = classSession.classType.price * creditsPurchased * (1 - discountRate)
    const amountInCents = Math.round(totalDollars * 100)
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
        bookingType,
        creditsPurchased: String(creditsPurchased),
        packSize: bookingType === "pack" ? String(normalizedPackSize) : "",
        autoRenew: bookingType === "pack" ? String(autoRenew) : "",
        unitClassPriceCents: String(Math.round(classSession.classType.price * 100)),
        ...(attributedTrackingCode ? { trackingCode: attributedTrackingCode } : {}),
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
      bookingType,
      creditsPurchased,
      autoRenew: bookingType === "pack" ? autoRenew : false,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}


























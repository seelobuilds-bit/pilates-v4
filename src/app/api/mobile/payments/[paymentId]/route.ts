import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function toMajorCurrency(amountInMinorUnits: number) {
  return amountInMinorUnits / 100
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Payments are available for studio owner accounts only" }, { status: 403 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    const { paymentId } = await params

    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        studioId: studio.id,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        receiptUrl: true,
        failureMessage: true,
        refundedAmount: true,
        refundedAt: true,
        stripePaymentIntentId: true,
        stripeChargeId: true,
        stripeRefundId: true,
        stripeCheckoutSessionId: true,
        stripeFee: true,
        applicationFee: true,
        netAmount: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            classSession: {
              select: {
                id: true,
                startTime: true,
                classType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 30,
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({
      role: "OWNER",
      studio: studioSummary,
      payment: {
        id: payment.id,
        amount: toMajorCurrency(payment.amount),
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
        receiptUrl: payment.receiptUrl,
        failureMessage: payment.failureMessage,
        refundedAmount: payment.refundedAmount,
        refundedAt: payment.refundedAt?.toISOString() || null,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeChargeId: payment.stripeChargeId,
        stripeRefundId: payment.stripeRefundId,
        stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
        stripeFee: payment.stripeFee,
        applicationFee: payment.applicationFee,
        netAmount: payment.netAmount,
        client: {
          id: payment.client.id,
          firstName: payment.client.firstName,
          lastName: payment.client.lastName,
          email: payment.client.email,
        },
        bookings: payment.bookings.map((booking) => ({
          id: booking.id,
          status: booking.status,
          createdAt: booking.createdAt.toISOString(),
          classSession: {
            id: booking.classSession.id,
            startTime: booking.classSession.startTime.toISOString(),
            classType: {
              id: booking.classSession.classType.id,
              name: booking.classSession.classType.name,
            },
          },
        })),
      },
    })
  } catch (error) {
    console.error("Mobile payment detail error:", error)
    return NextResponse.json({ error: "Failed to load payment detail" }, { status: 500 })
  }
}

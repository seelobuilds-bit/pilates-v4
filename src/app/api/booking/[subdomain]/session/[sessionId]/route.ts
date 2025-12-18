import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Get booking details from a checkout session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; sessionId: string }> }
) {
  try {
    const { subdomain, sessionId } = await params

    // Find the payment by checkout session ID
    const payment = await db.payment.findFirst({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        client: true,
        bookings: {
          include: {
            classSession: {
              include: {
                classType: true,
                teacher: { include: { user: true } },
                location: true,
              }
            }
          }
        }
      }
    })

    if (!payment) {
      // Payment might still be processing, return generic success
      return NextResponse.json({
        className: "Your Class",
        date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
        time: "Check your email for details",
        location: "See confirmation email",
        teacher: "Assigned instructor",
        price: 0
      })
    }

    const booking = payment.bookings[0]
    if (!booking) {
      return NextResponse.json({
        className: "Your Class",
        date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
        time: "Check your email for details",
        location: "See confirmation email", 
        teacher: "Assigned instructor",
        price: payment.amount / 100
      })
    }

    const session = booking.classSession

    return NextResponse.json({
      className: session.classType.name,
      date: new Date(session.startTime).toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "long", 
        day: "numeric",
        year: "numeric"
      }),
      time: new Date(session.startTime).toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit" 
      }),
      location: session.location.name,
      teacher: `${session.teacher.user.firstName} ${session.teacher.user.lastName}`,
      price: payment.amount / 100
    })
  } catch (error) {
    console.error("Error fetching session details:", error)
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 })
  }
}

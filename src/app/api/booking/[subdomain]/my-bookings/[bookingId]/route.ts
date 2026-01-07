import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"

// Cancellation policy defaults (in hours)
const DEFAULT_FREE_CANCELLATION_WINDOW = 24 // hours before class
const DEFAULT_LATE_CANCELLATION_WINDOW = 12 // hours - between this and free window, charge late fee
// Within LATE_CANCELLATION_WINDOW = no cancellation allowed (or 100% fee)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string; bookingId: string }> }
) {
  try {
    const { subdomain, bookingId } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        clientId: decoded.clientId,
        studioId: studio.id
      },
      include: {
        classSession: {
          include: {
            classType: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if already cancelled
    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 })
    }

    // Check if class has already happened
    const classStartTime = new Date(booking.classSession.startTime)
    const now = new Date()
    
    if (classStartTime < now) {
      return NextResponse.json({ 
        error: "Cannot cancel a class that has already started",
        classStartTime: classStartTime.toISOString()
      }, { status: 400 })
    }

    // Calculate hours until class
    const hoursUntilClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    // Determine cancellation type and any fees
    // TODO: These could be studio-configurable settings in the future
    const freeCancellationWindow = DEFAULT_FREE_CANCELLATION_WINDOW
    const lateCancellationWindow = DEFAULT_LATE_CANCELLATION_WINDOW
    
    let cancellationType: "FREE" | "LATE" | "NO_REFUND"
    let refundAmount = booking.paidAmount || 0
    let lateFeePercent = 0
    let message = ""

    if (hoursUntilClass >= freeCancellationWindow) {
      // Free cancellation - full refund
      cancellationType = "FREE"
      message = "Booking cancelled successfully. Full refund will be processed."
    } else if (hoursUntilClass >= lateCancellationWindow) {
      // Late cancellation - partial refund (50% fee)
      cancellationType = "LATE"
      lateFeePercent = 50
      refundAmount = (booking.paidAmount || 0) * 0.5
      message = `Late cancellation. A 50% cancellation fee applies. You will be refunded $${refundAmount.toFixed(2)}.`
    } else {
      // Too close to class - no refund (or reject cancellation)
      cancellationType = "NO_REFUND"
      refundAmount = 0
      // Option 1: Allow cancellation but no refund
      message = `Cancellation within ${lateCancellationWindow} hours of class. No refund available.`
      
      // Option 2: Reject cancellation entirely (uncomment to enable)
      // return NextResponse.json({ 
      //   error: `Cannot cancel within ${lateCancellationWindow} hours of class start time`,
      //   hoursUntilClass: Math.round(hoursUntilClass * 10) / 10,
      //   classStartTime: classStartTime.toISOString()
      // }, { status: 400 })
    }

    // Update booking status
    await db.booking.update({
      where: { id: booking.id },
      data: { 
        status: "CANCELLED",
        cancelledAt: new Date(),
        // Store cancellation details for reporting
        cancellationReason: `Client cancelled (${cancellationType})`,
      }
    })

    // TODO: Process refund via Stripe if applicable
    // if (refundAmount > 0 && booking.paymentId) {
    //   await processRefund(booking.paymentId, refundAmount)
    // }

    return NextResponse.json({ 
      success: true,
      cancellationType,
      hoursUntilClass: Math.round(hoursUntilClass * 10) / 10,
      originalAmount: booking.paidAmount || 0,
      refundAmount,
      lateFeePercent,
      message
    })
  } catch (error) {
    console.error("Cancellation error:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}

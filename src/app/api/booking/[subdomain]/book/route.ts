import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"
import { sendBookingConfirmationEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const decoded = await verifyClientToken(subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Please sign in to book" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { classSessionId, bookingType, recurringWeeks, packSize } = body

    const classSession = await db.classSession.findFirst({
      where: { id: classSessionId, studioId: studio.id },
      include: {
        classType: true,
        _count: { 
          select: { 
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "PENDING"] }
              }
            }
          }
        }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if class has started (can't book past classes)
    if (new Date(classSession.startTime) < new Date()) {
      return NextResponse.json({ error: "This class has already started" }, { status: 400 })
    }

    // CRITICAL FIX: Check for double-booking - same client can't book same class twice
    const existingBooking = await db.booking.findFirst({
      where: {
        clientId: decoded.clientId,
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] }
      }
    })

    if (existingBooking) {
      return NextResponse.json({ 
        error: "You have already booked this class",
        existingBookingId: existingBooking.id 
      }, { status: 400 })
    }

    // Check capacity (only count confirmed and pending bookings)
    const activeBookingsCount = await db.booking.count({
      where: {
        classSessionId: classSession.id,
        status: { in: ["CONFIRMED", "PENDING"] }
      }
    })

    if (activeBookingsCount >= classSession.capacity) {
      return NextResponse.json({ 
        error: "Class is full",
        spotsLeft: 0,
        canJoinWaitlist: true // Future: implement waitlist
      }, { status: 400 })
    }

    // Calculate amount
    let amount = classSession.classType.price
    if (bookingType === "recurring") {
      amount = classSession.classType.price * (recurringWeeks || 4) * 0.9
    } else if (bookingType === "pack") {
      amount = classSession.classType.price * (packSize || 5) * 0.85
    }

    // Create booking as PENDING - will be CONFIRMED after payment
    // For free classes, immediately confirm
    const isFreeClass = amount === 0
    
    const booking = await db.booking.create({
      data: {
        studioId: studio.id,
        clientId: decoded.clientId,
        classSessionId: classSession.id,
        status: isFreeClass ? "CONFIRMED" : "PENDING",
        paidAmount: isFreeClass ? 0 : null // Set after payment
      },
      include: {
        client: true,
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true
          }
        }
      }
    })

    // Send booking confirmation email (don't await to avoid slowing down response)
    sendBookingConfirmationEmail({
      studioId: studio.id,
      studioName: studio.name,
      clientEmail: booking.client.email,
      clientName: booking.client.firstName,
      booking: {
        bookingId: booking.id,
        className: booking.classSession.classType.name,
        teacherName: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`,
        locationName: booking.classSession.location.name,
        locationAddress: booking.classSession.location.address || undefined,
        startTime: booking.classSession.startTime,
        endTime: booking.classSession.endTime,
        amount: isFreeClass ? undefined : amount,
        status: booking.status
      },
      manageBookingUrl: `https://${subdomain}.thecurrent.app/account`
    }).catch(err => console.error('Failed to send booking confirmation:', err))

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id,
      status: booking.status,
      requiresPayment: !isFreeClass,
      amount,
      classDetails: {
        name: booking.classSession.classType.name,
        startTime: booking.classSession.startTime,
        location: booking.classSession.location.name,
        teacher: `${booking.classSession.teacher.user.firstName} ${booking.classSession.teacher.user.lastName}`
      }
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

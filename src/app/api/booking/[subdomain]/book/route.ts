import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret")

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    // Verify authentication
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${params.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Please sign in to book" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const clientId = payload.clientId as string

    const body = await request.json()
    const { classSessionId, bookingType, recurringWeeks, packSize, autoRenew } = body

    if (!classSessionId) {
      return NextResponse.json({ error: "Class session required" }, { status: 400 })
    }

    // Get studio
    const studio = await db.studio.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Get class session
    const classSession = await db.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        classType: true,
        _count: { select: { bookings: { where: { status: "confirmed" } } } }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check capacity
    const spotsLeft = classSession.capacity - classSession._count.bookings
    if (spotsLeft <= 0) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 })
    }

    // Calculate price
    let price = classSession.classType.price
    if (bookingType === "recurring" && recurringWeeks) {
      price = price * recurringWeeks * 0.9 // 10% off
    } else if (bookingType === "pack" && packSize) {
      price = price * packSize * 0.85 // 15% off
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        studioId: studio.id,
        clientId,
        classSessionId,
        paidAmount: price,
        status: "confirmed"
      }
    })

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id,
      bookingType,
      autoRenew
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Booking failed" }, { status: 500 })
  }
}




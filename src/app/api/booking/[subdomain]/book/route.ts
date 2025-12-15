import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const studio = await db.studio.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const token = cookies().get(`client_token_${studio.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Please sign in to book" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { classSessionId, bookingType, recurringWeeks, packSize, autoRenew } = body

    const classSession = await db.classSession.findFirst({
      where: { id: classSessionId, studioId: studio.id },
      include: {
        classType: true,
        _count: { select: { bookings: true } }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (classSession._count.bookings >= classSession.capacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 })
    }

    let amount = classSession.classType.price
    if (bookingType === "recurring") {
      amount = classSession.classType.price * (recurringWeeks || 4) * 0.9
    } else if (bookingType === "pack") {
      amount = classSession.classType.price * (packSize || 5) * 0.85
    }

    const booking = await db.booking.create({
      data: {
        studioId: studio.id,
        clientId: decoded.clientId,
        classSessionId: classSession.id,
        status: "CONFIRMED",
        paidAmount: amount
      }
    })

    return NextResponse.json({ success: true, bookingId: booking.id })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

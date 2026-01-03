import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

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

    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        clientId: decoded.clientId,
        studioId: studio.id
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    await db.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}

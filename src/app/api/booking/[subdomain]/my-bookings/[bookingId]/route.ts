import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret")

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subdomain: string; bookingId: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${params.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const clientId = payload.clientId as string

    // Verify booking belongs to client
    const booking = await db.booking.findFirst({
      where: {
        id: params.bookingId,
        clientId
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Cancel booking
    await db.booking.update({
      where: { id: params.bookingId },
      data: { status: "cancelled" }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}




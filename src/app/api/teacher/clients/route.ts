import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const teacherId = session.user.teacherId

    // Get all bookings for this teacher's classes
    const bookings = await db.booking.findMany({
      where: {
        classSession: {
          teacherId
        }
      },
      include: {
        client: true,
        classSession: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Group by client and count bookings
    const clientMap = new Map<string, {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
      bookingsCount: number
      lastBooking: string | null
    }>()

    for (const booking of bookings) {
      const client = booking.client
      const existing = clientMap.get(client.id)
      
      if (existing) {
        existing.bookingsCount++
        if (!existing.lastBooking || new Date(booking.classSession.startTime) > new Date(existing.lastBooking)) {
          existing.lastBooking = booking.classSession.startTime.toISOString()
        }
      } else {
        clientMap.set(client.id, {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          bookingsCount: 1,
          lastBooking: booking.classSession.startTime.toISOString()
        })
      }
    }

    const clients = Array.from(clientMap.values())
      .sort((a, b) => b.bookingsCount - a.bookingsCount)

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Failed to fetch teacher clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}




























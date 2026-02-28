import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientTokenFromRequest } from "@/lib/client-auth"

export async function GET(
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

    const decoded = await verifyClientTokenFromRequest(request, subdomain)

    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const bookings = await db.booking.findMany({
      where: {
        clientId: decoded.clientId,
        studioId: studio.id
      },
      include: {
        classSession: {
          include: {
            classType: true,
            teacher: { include: { user: true } },
            location: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Add cancellation policy info to each booking
    const bookingsWithPolicy = bookings.map(booking => {
      const classStartTime = new Date(booking.classSession.startTime)
      const now = new Date()
      const hoursUntilClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      let canCancel = false
      let cancellationInfo = ""
      
      if (booking.status === "CANCELLED") {
        cancellationInfo = "Already cancelled"
      } else if (classStartTime < now) {
        cancellationInfo = "Class has passed"
      } else if (hoursUntilClass >= 24) {
        canCancel = true
        cancellationInfo = "Free cancellation available"
      } else if (hoursUntilClass >= 12) {
        canCancel = true
        cancellationInfo = "Late cancellation - 50% fee applies"
      } else {
        canCancel = true
        cancellationInfo = "No refund available"
      }

      return {
        ...booking,
        canCancel,
        cancellationInfo,
        hoursUntilClass: Math.round(hoursUntilClass * 10) / 10
      }
    })

    return NextResponse.json(bookingsWithPolicy)
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { cancelClientBookingPlan } from "@/lib/client-booking-plans"
import { resolveMobileTokenContext } from "@/lib/mobile-auth-context"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const auth = resolveMobileTokenContext(request.headers.get("authorization"))
    if (!auth.ok || auth.decoded.role !== "CLIENT") {
      return NextResponse.json({ error: "Client session required" }, { status: 401 })
    }

    const decoded = auth.decoded
    const { planId } = await params
    const clientId = decoded.clientId || decoded.sub

    const result = await cancelClientBookingPlan({
      planId,
      clientId,
      studioId: decoded.studioId,
    })

    if (!result.ok) {
      return NextResponse.json({ error: "Booking plan not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      alreadyCancelled: result.alreadyCancelled,
      message: result.message,
      accessUntil: result.accessUntil,
    })
  } catch (error) {
    console.error("Mobile client plan cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel class plan" }, { status: 500 })
  }
}

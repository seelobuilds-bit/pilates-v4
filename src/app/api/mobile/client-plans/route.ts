import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok || auth.decoded.role !== "CLIENT") {
      return NextResponse.json({ error: "Client session required" }, { status: 401 })
    }

    const decoded = auth.decoded
    const clientId = decoded.clientId || decoded.sub

    const plans = await db.clientBookingPlan.findMany({
      where: {
        studioId: auth.studio.id,
        clientId,
      },
      orderBy: [
        { status: "asc" },
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        kind: true,
        status: true,
        title: true,
        description: true,
        autoRenew: true,
        creditsPerRenewal: true,
        pricePerCycle: true,
        currency: true,
        nextChargeAt: true,
        classTypeName: true,
        teacherName: true,
        locationName: true,
        cancelledAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      role: "CLIENT",
      studio: toMobileStudioSummary(auth.studio),
      plans,
    })
  } catch (error) {
    console.error("Mobile client plans error:", error)
    return NextResponse.json({ error: "Failed to load class plans" }, { status: 500 })
  }
}

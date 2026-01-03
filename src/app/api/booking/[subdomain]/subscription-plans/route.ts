import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  try {
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    // Get all active subscription plans for this studio
    // Filter to CLIENTS and TEACHERS plans (not STUDIO_OWNERS)
    const plans = await db.vaultSubscriptionPlan.findMany({
      where: {
        studioId: studio.id,
        isActive: true,
        audience: { in: ["CLIENTS", "TEACHERS"] }
      },
      include: {
        communityChat: {
          select: { id: true, isEnabled: true }
        }
      },
      orderBy: { monthlyPrice: "asc" }
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Failed to fetch subscription plans:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}










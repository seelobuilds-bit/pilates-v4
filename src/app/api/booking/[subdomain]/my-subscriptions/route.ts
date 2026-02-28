import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyClientToken } from "@/lib/client-auth"

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

    const decoded = await verifyClientToken(subdomain)
    if (!decoded) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const client = await db.client.findUnique({
      where: { id: decoded.clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get client's vault subscriptions
    const now = new Date()
    const [subscriptions, bookingPlans] = await Promise.all([
      db.vaultSubscriber.findMany({
        where: {
          clientId: client.id,
          OR: [
            { status: "active" },
            { status: "cancelled", currentPeriodEnd: { gt: now } },
          ],
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              audience: true,
              monthlyPrice: true,
              yearlyPrice: true,
              features: true,
              description: true,
              communityChat: {
                select: {
                  id: true,
                  isEnabled: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      db.clientBookingPlan.findMany({
        where: {
          clientId: client.id,
          OR: [
            { status: "active" },
            { status: "cancelled" },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ subscriptions, bookingPlans })
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}












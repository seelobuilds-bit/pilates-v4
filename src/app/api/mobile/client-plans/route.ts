import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded || decoded.role !== "CLIENT") {
      return NextResponse.json({ error: "Client session required" }, { status: 401 })
    }

    const clientId = decoded.clientId || decoded.sub

    const [studio, plans] = await Promise.all([
      db.studio.findUnique({
        where: { id: decoded.studioId },
        select: {
          id: true,
          name: true,
          subdomain: true,
          primaryColor: true,
          stripeCurrency: true,
        },
      }),
      db.clientBookingPlan.findMany({
        where: {
          studioId: decoded.studioId,
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
      }),
    ])

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    return NextResponse.json({
      role: "CLIENT",
      studio: {
        id: studio.id,
        name: studio.name,
        subdomain: studio.subdomain,
        primaryColor: studio.primaryColor,
        currency: studio.stripeCurrency,
      },
      plans,
    })
  } catch (error) {
    console.error("Mobile client plans error:", error)
    return NextResponse.json({ error: "Failed to load class plans" }, { status: 500 })
  }
}

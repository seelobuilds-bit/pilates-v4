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
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: { id: true, subdomain: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const actorFilter =
      decoded.actorType === "CLIENT"
        ? { clientId: decoded.clientId || decoded.sub }
        : { userId: decoded.sub }

    const [totalCount, enabledCount, latestDevice] = await Promise.all([
      db.mobilePushDevice.count({
        where: {
          studioId: studio.id,
          ...actorFilter,
        },
      }),
      db.mobilePushDevice.count({
        where: {
          studioId: studio.id,
          ...actorFilter,
          isEnabled: true,
        },
      }),
      db.mobilePushDevice.findFirst({
        where: {
          studioId: studio.id,
          ...actorFilter,
        },
        orderBy: {
          lastSeenAt: "desc",
        },
        select: {
          lastSeenAt: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      push: {
        totalCount,
        enabledCount,
        disabledCount: Math.max(totalCount - enabledCount, 0),
        latestSeenAt: latestDevice?.lastSeenAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error("Mobile push status error:", error)
    return NextResponse.json({ error: "Failed to load push status" }, { status: 500 })
  }
}

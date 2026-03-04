import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileTokenContext } from "@/lib/mobile-auth-context"

export async function POST(request: NextRequest) {
  try {
    const auth = resolveMobileTokenContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const decoded = auth.decoded

    const body = await request.json().catch(() => ({}))
    const expoPushToken = String(body?.expoPushToken || "").trim()

    const actorFilter =
      decoded.actorType === "CLIENT"
        ? { clientId: decoded.clientId || decoded.sub }
        : { userId: decoded.sub }

    const where = {
      studioId: decoded.studioId,
      ...actorFilter,
      ...(expoPushToken ? { expoPushToken } : {}),
    }

    const result = await db.mobilePushDevice.updateMany({
      where,
      data: {
        isEnabled: false,
        disabledAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      disabledCount: result.count,
    })
  } catch (error) {
    console.error("Mobile push unregister error:", error)
    return NextResponse.json({ error: "Failed to unregister push token" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import { sendMobilePushNotification } from "@/lib/mobile-push"

export async function POST(request: NextRequest) {
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
      select: { id: true, subdomain: true, name: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const message = String(body?.message || "").trim() || "Push notifications are connected."

    const result =
      decoded.role === "CLIENT"
        ? await sendMobilePushNotification({
            studioId: studio.id,
            clientIds: [decoded.clientId || decoded.sub],
            category: "SYSTEM",
            title: `${studio.name} test notification`,
            body: message,
            data: {
              type: "mobile_push_test",
              role: decoded.role,
              studioId: studio.id,
            },
          })
        : await sendMobilePushNotification({
            studioId: studio.id,
            userIds: [decoded.sub],
            category: "SYSTEM",
            title: `${studio.name} test notification`,
            body: message,
            data: {
              type: "mobile_push_test",
              role: decoded.role,
              studioId: studio.id,
            },
          })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Mobile push test error:", error)
    return NextResponse.json({ error: "Failed to send test push" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { sendMobilePushNotification } from "@/lib/mobile-push"

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      if (auth.reason === "invalid_token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const decoded = auth.decoded
    const studio = auth.studio

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

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function normalizePlatform(value: unknown): "IOS" | "ANDROID" | "WEB" | "UNKNOWN" {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()

  if (normalized === "IOS" || normalized === "ANDROID" || normalized === "WEB") {
    return normalized
  }

  return "UNKNOWN"
}

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
      select: { id: true, subdomain: true },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const body = await request.json()
    const expoPushToken = String(body?.expoPushToken || "").trim()
    const deviceId = String(body?.deviceId || "").trim() || null
    const appVersion = String(body?.appVersion || "").trim() || null
    const buildNumber = String(body?.buildNumber || "").trim() || null

    if (!expoPushToken) {
      return NextResponse.json({ error: "expoPushToken is required" }, { status: 400 })
    }

    const actorType = decoded.actorType === "CLIENT" ? "CLIENT" : "USER"
    const role = decoded.role

    if (role !== "OWNER" && role !== "TEACHER" && role !== "CLIENT") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const userId = actorType === "USER" ? decoded.sub : null
    const clientId = actorType === "CLIENT" ? decoded.clientId || decoded.sub : null

    const now = new Date()

    const device = await db.mobilePushDevice.upsert({
      where: {
        studioId_expoPushToken: {
          studioId: decoded.studioId,
          expoPushToken,
        },
      },
      create: {
        studioId: decoded.studioId,
        actorType,
        role,
        userId,
        clientId,
        expoPushToken,
        platform: normalizePlatform(body?.platform),
        deviceId,
        appVersion,
        buildNumber,
        isEnabled: true,
        lastSeenAt: now,
        disabledAt: null,
      },
      update: {
        actorType,
        role,
        userId,
        clientId,
        platform: normalizePlatform(body?.platform),
        deviceId,
        appVersion,
        buildNumber,
        isEnabled: true,
        lastSeenAt: now,
        disabledAt: null,
      },
      select: {
        id: true,
        platform: true,
        isEnabled: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      device,
    })
  } catch (error) {
    console.error("Mobile push register error:", error)
    return NextResponse.json({ error: "Failed to register push token" }, { status: 500 })
  }
}

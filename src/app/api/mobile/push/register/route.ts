import { NextRequest, NextResponse } from "next/server"
import type { MobilePushActorType, MobilePushPlatform, MobilePushRole } from "@prisma/client"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import {
  isPrismaMissingColumnError,
  normalizeMobilePushCategories,
} from "@/lib/mobile-push-categories"

function normalizePlatform(value: unknown): MobilePushPlatform {
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
    const notificationCategories = normalizeMobilePushCategories(body?.notificationCategories)

    if (!expoPushToken) {
      return NextResponse.json({ error: "expoPushToken is required" }, { status: 400 })
    }

    const actorType: MobilePushActorType = decoded.actorType === "CLIENT" ? "CLIENT" : "USER"
    const role = decoded.role as MobilePushRole

    if (role !== "OWNER" && role !== "TEACHER" && role !== "CLIENT") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const userId = actorType === "USER" ? decoded.sub : null
    const clientId = actorType === "CLIENT" ? decoded.clientId || decoded.sub : null

    const now = new Date()
    const platform: MobilePushPlatform = normalizePlatform(body?.platform)
    const where = {
      studioId_expoPushToken: {
        studioId: decoded.studioId,
        expoPushToken,
      },
    }
    const createData = {
      studioId: decoded.studioId,
      actorType,
      role,
      userId,
      clientId,
      expoPushToken,
      platform,
      deviceId,
      appVersion,
      buildNumber,
      isEnabled: true,
      lastSeenAt: now,
      disabledAt: null as Date | null,
    }
    const updateData = {
      actorType,
      role,
      userId,
      clientId,
      platform,
      deviceId,
      appVersion,
      buildNumber,
      isEnabled: true,
      lastSeenAt: now,
      disabledAt: null as Date | null,
    }

    let device: {
      id: string
      platform: "IOS" | "ANDROID" | "WEB" | "UNKNOWN"
      isEnabled: boolean
      updatedAt: Date
      notificationCategories?: string[]
    }

    try {
      device = await db.mobilePushDevice.upsert({
        where,
        create: {
          ...createData,
          notificationCategories,
        },
        update: {
          ...updateData,
          notificationCategories,
        },
        select: {
          id: true,
          platform: true,
          isEnabled: true,
          notificationCategories: true,
          updatedAt: true,
        },
      })
    } catch (error) {
      if (!isPrismaMissingColumnError(error)) {
        throw error
      }

      // Rollout-safe fallback when DB schema has not yet added notificationCategories.
      const legacyDevice = await db.mobilePushDevice.upsert({
        where,
        create: createData,
        update: updateData,
        select: {
          id: true,
          platform: true,
          isEnabled: true,
          updatedAt: true,
        },
      })

      device = {
        ...legacyDevice,
        notificationCategories,
      }
    }

    return NextResponse.json({
      success: true,
      device,
    })
  } catch (error) {
    console.error("Mobile push register error:", error)
    return NextResponse.json({ error: "Failed to register push token" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

function normalizeHexColor(value: unknown) {
  const candidate = String(value || "").trim().toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(candidate)) {
    return null
  }
  return candidate
}

async function resolveStudioFromToken(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return { error: NextResponse.json({ error: "Missing bearer token" }, { status: 401 }) }
  }

  const decoded = verifyMobileToken(token)
  if (!decoded) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) }
  }

  const studio = await db.studio.findUnique({
    where: { id: decoded.studioId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      primaryColor: true,
      stripeCurrency: true,
    },
  })

  if (!studio || studio.subdomain !== decoded.studioSubdomain) {
    return { error: NextResponse.json({ error: "Studio not found" }, { status: 401 }) }
  }

  return { decoded, studio }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveStudioFromToken(request)
    if ("error" in auth) {
      return auth.error
    }

    return NextResponse.json({
      role: auth.decoded.role,
      studio: {
        id: auth.studio.id,
        name: auth.studio.name,
        subdomain: auth.studio.subdomain,
        primaryColor: auth.studio.primaryColor,
        currency: auth.studio.stripeCurrency,
      },
    })
  } catch (error) {
    console.error("Mobile branding GET error:", error)
    return NextResponse.json({ error: "Failed to load branding settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await resolveStudioFromToken(request)
    if ("error" in auth) {
      return auth.error
    }

    if (auth.decoded.role !== "OWNER") {
      return NextResponse.json({ error: "Only studio owners can update branding" }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    const nextPrimaryColor = normalizeHexColor(payload?.primaryColor)
    if (!nextPrimaryColor) {
      return NextResponse.json({ error: "Primary color must be a hex color like #2563eb" }, { status: 400 })
    }

    const updatedStudio = await db.studio.update({
      where: { id: auth.studio.id },
      data: { primaryColor: nextPrimaryColor },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    return NextResponse.json({
      success: true,
      studio: {
        id: updatedStudio.id,
        name: updatedStudio.name,
        subdomain: updatedStudio.subdomain,
        primaryColor: updatedStudio.primaryColor,
        currency: updatedStudio.stripeCurrency,
      },
    })
  } catch (error) {
    console.error("Mobile branding PATCH error:", error)
    return NextResponse.json({ error: "Failed to update branding settings" }, { status: 500 })
  }
}

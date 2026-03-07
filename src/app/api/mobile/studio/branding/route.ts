import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"
import { buildStudioBrandingFoundation } from "@/lib/studio-branding-foundation"

function normalizeHexColor(value: unknown) {
  const candidate = String(value || "").trim().toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(candidate)) {
    return null
  }
  return candidate
}

export async function GET(request: NextRequest) {
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

    const studio = await db.studio.findUnique({
      where: { id: auth.studio.id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        logoUrl: true,
        logoScale: true,
        stripeCurrency: true,
        typographyConfig: {
          select: {
            displayFontKey: true,
            bodyFontKey: true,
            displayFontFamily: true,
            bodyFontFamily: true,
            displayFontSourceUrl: true,
            bodyFontSourceUrl: true,
          },
        },
        brandingConfig: {
          select: {
            primaryColor: true,
            primaryColorStrong: true,
            accentSoft: true,
            canvasColor: true,
            surfaceColor: true,
            subtleColor: true,
            textPrimary: true,
            textMuted: true,
            logoUrl: true,
            logoInverseUrl: true,
            logoScale: true,
          },
        },
        appConfig: {
          select: {
            appDisplayName: true,
            supportEmail: true,
            supportUrl: true,
            privacyPolicyUrl: true,
            termsUrl: true,
            appStoreSubtitle: true,
            iconUrl: true,
            splashImageUrl: true,
            splashBackgroundColor: true,
            iosBundleIdentifier: true,
            androidPackageName: true,
            expoProjectId: true,
          },
        },
      },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    return NextResponse.json({
      role: auth.decoded.role,
      studio: toMobileStudioSummary(studio),
      brandingFoundation: buildStudioBrandingFoundation(studio),
    })
  } catch (error) {
    console.error("Mobile branding GET error:", error)
    return NextResponse.json({ error: "Failed to load branding settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const refreshedStudio = await db.studio.findUnique({
      where: { id: updatedStudio.id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        logoUrl: true,
        logoScale: true,
        stripeCurrency: true,
        typographyConfig: {
          select: {
            displayFontKey: true,
            bodyFontKey: true,
            displayFontFamily: true,
            bodyFontFamily: true,
            displayFontSourceUrl: true,
            bodyFontSourceUrl: true,
          },
        },
        brandingConfig: {
          select: {
            primaryColor: true,
            primaryColorStrong: true,
            accentSoft: true,
            canvasColor: true,
            surfaceColor: true,
            subtleColor: true,
            textPrimary: true,
            textMuted: true,
            logoUrl: true,
            logoInverseUrl: true,
            logoScale: true,
          },
        },
        appConfig: {
          select: {
            appDisplayName: true,
            supportEmail: true,
            supportUrl: true,
            privacyPolicyUrl: true,
            termsUrl: true,
            appStoreSubtitle: true,
            iconUrl: true,
            splashImageUrl: true,
            splashBackgroundColor: true,
            iosBundleIdentifier: true,
            androidPackageName: true,
            expoProjectId: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      studio: toMobileStudioSummary(updatedStudio),
      brandingFoundation: buildStudioBrandingFoundation(
        refreshedStudio || {
          id: updatedStudio.id,
          name: updatedStudio.name,
          subdomain: updatedStudio.subdomain,
          primaryColor: updatedStudio.primaryColor,
          logoUrl: null,
          logoScale: 100,
          stripeCurrency: updatedStudio.stripeCurrency,
        }
      ),
    })
  } catch (error) {
    console.error("Mobile branding PATCH error:", error)
    return NextResponse.json({ error: "Failed to update branding settings" }, { status: 500 })
  }
}

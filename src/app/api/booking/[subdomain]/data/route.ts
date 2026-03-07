import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildStudioBrandingFoundation } from "@/lib/studio-branding-foundation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        logoUrl: true,
        logoScale: true,
        stripeCurrency: true,
        stripeChargesEnabled: true,
        stripeOnboardingComplete: true,
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
        locations: {
          where: { isActive: true },
          orderBy: { name: "asc" }
        },
        classTypes: {
          where: { isActive: true },
          orderBy: { name: "asc" }
        },
        teachers: {
          where: { isActive: true },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        merchStore: {
          select: { isEnabled: true }
        },
        vaultSubscriptionPlans: {
          where: { isActive: true },
          take: 1
        }
      }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const brandingFoundation = buildStudioBrandingFoundation({
      id: studio.id,
      name: studio.name,
      subdomain,
      primaryColor: studio.primaryColor,
      logoUrl: studio.logoUrl,
      logoScale: studio.logoScale,
      stripeCurrency: studio.stripeCurrency,
      typographyConfig: studio.typographyConfig,
    })

    return NextResponse.json({
      id: studio.id,
      name: studio.name,
      primaryColor: studio.primaryColor,
      logoUrl: studio.logoUrl,
      logoScale: studio.logoScale,
      stripeCurrency: studio.stripeCurrency || "usd",
      bookingFontKey: brandingFoundation.typography.bodyFontKey,
      brandingFoundation,
      locations: studio.locations,
      classTypes: studio.classTypes,
      teachers: studio.teachers,
      stripeEnabled: studio.stripeChargesEnabled && studio.stripeOnboardingComplete,
      hasStore: studio.merchStore?.isEnabled ?? false,
      hasVault: studio.vaultSubscriptionPlans.length > 0
    })
  } catch (error) {
    console.error("Failed to fetch studio data:", error)
    return NextResponse.json({ error: "Failed to fetch studio data" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

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
        stripeChargesEnabled: true,
        stripeOnboardingComplete: true,
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

    return NextResponse.json({
      id: studio.id,
      name: studio.name,
      primaryColor: studio.primaryColor,
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

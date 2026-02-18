import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { normalizeSocialTrackingCode, trackSocialLinkClick } from "@/lib/social-tracking"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const trackingCode = normalizeSocialTrackingCode(body?.trackingCode)

    if (!trackingCode) {
      return NextResponse.json({ tracked: false })
    }

    const studio = await db.studio.findFirst({
      where: {
        subdomain: {
          equals: subdomain,
          mode: "insensitive"
        }
      },
      select: {
        id: true
      }
    })

    if (!studio) {
      return NextResponse.json({ tracked: false }, { status: 404 })
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || ""
    const userAgent = request.headers.get("user-agent") || ""
    const fingerprint = `${forwardedFor}|${userAgent}|${trackingCode}`

    const tracked = await trackSocialLinkClick({
      studioId: studio.id,
      trackingCode,
      fingerprint
    })

    return NextResponse.json({ tracked })
  } catch (error) {
    console.error("Failed to track social link click:", error)
    return NextResponse.json({ tracked: false }, { status: 500 })
  }
}

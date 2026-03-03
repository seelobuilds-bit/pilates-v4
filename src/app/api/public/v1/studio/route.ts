import { NextRequest, NextResponse } from "next/server"
import { requirePublicApiAuth, withPublicApiHeaders } from "@/lib/public-api"

export async function GET(request: NextRequest) {
  const { auth, response } = await requirePublicApiAuth(request, "studio.read")
  if (response || !auth) return withPublicApiHeaders(response!)

  return withPublicApiHeaders(
    NextResponse.json({
      data: {
        id: auth.studio.id,
        name: auth.studio.name,
        subdomain: auth.studio.subdomain,
        primaryColor: auth.studio.primaryColor,
        currency: auth.studio.currency,
      },
    })
  )
}

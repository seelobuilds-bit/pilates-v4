import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getSocialMediaMode } from "@/lib/social-media-mode"
import {
  buildAuthorizeUrl,
  createSignedSocialOauthState,
  missingProviderEnv,
  parseSocialOwnerType,
  parseSocialPlatform,
  resolveOauthReturnPath,
} from "@/lib/social/oauth"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id || !session.user.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (getSocialMediaMode() !== "LIVE") {
    return NextResponse.json(
      { error: "LIVE social mode is not enabled. Set SOCIAL_MEDIA_MODE=LIVE." },
      { status: 503 }
    )
  }

  const platform = parseSocialPlatform(request.nextUrl.searchParams.get("platform"))
  if (!platform) {
    return NextResponse.json({ error: "platform must be INSTAGRAM or TIKTOK" }, { status: 400 })
  }

  const requestedOwnerType = parseSocialOwnerType(request.nextUrl.searchParams.get("ownerType"))
  const ownerType = requestedOwnerType || (session.user.teacherId ? "TEACHER" : "STUDIO")

  if (ownerType === "TEACHER" && !session.user.teacherId) {
    return NextResponse.json({ error: "Only teachers can connect teacher-owned social accounts" }, { status: 403 })
  }
  if (ownerType === "STUDIO" && session.user.teacherId) {
    return NextResponse.json({ error: "Teacher users can only connect teacher-owned social accounts" }, { status: 403 })
  }

  const missingEnv = missingProviderEnv(platform)
  if (missingEnv.length > 0) {
    return NextResponse.json(
      {
        error: "Provider OAuth is not configured",
        platform,
        missingEnv,
      },
      { status: 503 }
    )
  }

  const returnPath = resolveOauthReturnPath(ownerType, request.nextUrl.searchParams.get("returnPath"))
  const state = createSignedSocialOauthState({
    userId: session.user.id,
    studioId: session.user.studioId,
    teacherId: session.user.teacherId,
    ownerType,
    platform,
    returnPath,
  })

  const authorizeUrl = buildAuthorizeUrl({
    platform,
    request,
    state,
  })

  return NextResponse.json({
    platform,
    ownerType,
    authorizeUrl,
  })
}


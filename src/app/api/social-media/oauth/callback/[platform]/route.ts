import { SocialPlatform } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSocialMediaMode } from "@/lib/social-media-mode"
import { getSession } from "@/lib/session"
import {
  exchangeInstagramCode,
  exchangeTikTokCode,
  missingProviderEnv,
  parseSignedSocialOauthState,
  parseSocialPlatform,
} from "@/lib/social/oauth"

function buildRedirectUrl(request: NextRequest, returnPath: string, status: string, message?: string) {
  const target = new URL(returnPath, request.nextUrl.origin)
  target.searchParams.set("oauth", status)
  if (message) target.searchParams.set("oauthMessage", message)
  return NextResponse.redirect(target)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform: rawPlatform } = await params
  const platform = parseSocialPlatform(rawPlatform)
  if (!platform) {
    return NextResponse.json({ error: "Invalid platform callback" }, { status: 400 })
  }

  const statePayload = parseSignedSocialOauthState(request.nextUrl.searchParams.get("state"))
  const fallbackPath = platform === "TIKTOK" ? "/teacher/social" : "/studio/marketing/social"
  if (!statePayload) {
    return buildRedirectUrl(request, fallbackPath, "error", "Invalid or expired OAuth state")
  }
  if (statePayload.platform !== platform) {
    return buildRedirectUrl(request, statePayload.returnPath, "error", "OAuth platform mismatch")
  }

  const session = await getSession()
  if (!session?.user?.id || session.user.id !== statePayload.userId) {
    return buildRedirectUrl(request, statePayload.returnPath, "error", "Session expired, please try again")
  }
  if (getSocialMediaMode() !== "LIVE") {
    return buildRedirectUrl(request, statePayload.returnPath, "error", "LIVE social mode is not enabled")
  }

  const missingEnv = missingProviderEnv(platform)
  if (missingEnv.length > 0) {
    return buildRedirectUrl(request, statePayload.returnPath, "error", `Missing config: ${missingEnv.join(", ")}`)
  }

  const providerError = request.nextUrl.searchParams.get("error_description") || request.nextUrl.searchParams.get("error")
  if (providerError) {
    return buildRedirectUrl(request, statePayload.returnPath, "error", providerError)
  }

  const code = request.nextUrl.searchParams.get("code")
  if (!code) {
    return buildRedirectUrl(request, statePayload.returnPath, "error", "Missing OAuth code")
  }

  try {
    const tokenData = platform === "INSTAGRAM"
      ? await exchangeInstagramCode(request, code)
      : await exchangeTikTokCode(request, code)

    const saved = await db.socialMediaAccount.upsert({
      where: {
        platform_platformUserId: {
          platform: platform as SocialPlatform,
          platformUserId: tokenData.platformUserId,
        },
      },
      update: {
        username: tokenData.username,
        displayName: tokenData.displayName,
        profilePicture: tokenData.profilePicture,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: tokenData.tokenExpiresAt,
        isActive: true,
        followerCount: tokenData.followerCount,
        followingCount: tokenData.followingCount,
        postsCount: tokenData.postsCount,
        lastSyncedAt: new Date(),
        studioId: statePayload.ownerType === "STUDIO" ? statePayload.studioId : null,
        teacherId: statePayload.ownerType === "TEACHER" ? statePayload.teacherId : null,
      },
      create: {
        platform: platform as SocialPlatform,
        platformUserId: tokenData.platformUserId,
        username: tokenData.username,
        displayName: tokenData.displayName,
        profilePicture: tokenData.profilePicture,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: tokenData.tokenExpiresAt,
        followerCount: tokenData.followerCount,
        followingCount: tokenData.followingCount,
        postsCount: tokenData.postsCount,
        isActive: true,
        lastSyncedAt: new Date(),
        studioId: statePayload.ownerType === "STUDIO" ? statePayload.studioId : null,
        teacherId: statePayload.ownerType === "TEACHER" ? statePayload.teacherId : null,
      },
      select: { id: true },
    })

    return buildRedirectUrl(request, statePayload.returnPath, "connected", saved.id)
  } catch (error) {
    console.error(`Failed to complete ${platform} OAuth callback:`, error)
    return buildRedirectUrl(request, statePayload.returnPath, "error", "OAuth callback failed")
  }
}


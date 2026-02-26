import { createHmac, timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

export type SocialPlatform = "INSTAGRAM" | "TIKTOK"
export type SocialOwnerType = "STUDIO" | "TEACHER"

type SocialOauthStatePayload = {
  userId: string
  studioId: string
  teacherId: string | null
  ownerType: SocialOwnerType
  platform: SocialPlatform
  returnPath: string
  exp: number
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, "base64").toString("utf8")
}

function signStatePayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("hex")
}

function getStateSecret() {
  return process.env.SOCIAL_OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET || ""
}

export function createSignedSocialOauthState(payload: Omit<SocialOauthStatePayload, "exp">, ttlSeconds = 60 * 15) {
  const secret = getStateSecret()
  if (!secret) {
    throw new Error("Missing SOCIAL_OAUTH_STATE_SECRET (or NEXTAUTH_SECRET)")
  }

  const fullPayload: SocialOauthStatePayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = signStatePayload(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function parseSignedSocialOauthState(state: string | null): SocialOauthStatePayload | null {
  if (!state) return null
  const [encodedPayload, signature] = state.split(".")
  if (!encodedPayload || !signature) return null

  const secret = getStateSecret()
  if (!secret) return null
  const expectedSignature = signStatePayload(encodedPayload, secret)
  const signatureBuf = Buffer.from(signature, "utf8")
  const expectedBuf = Buffer.from(expectedSignature, "utf8")
  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SocialOauthStatePayload
    if (!payload?.userId || !payload.studioId || !payload.ownerType || !payload.platform || !payload.exp) {
      return null
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function parseSocialPlatform(value: string | null): SocialPlatform | null {
  const normalized = String(value || "").trim().toUpperCase()
  if (normalized === "INSTAGRAM" || normalized === "TIKTOK") {
    return normalized
  }
  return null
}

export function parseSocialOwnerType(value: string | null): SocialOwnerType | null {
  const normalized = String(value || "").trim().toUpperCase()
  if (normalized === "STUDIO" || normalized === "TEACHER") {
    return normalized
  }
  return null
}

function sanitizeReturnPath(path: string | null) {
  if (!path) return "/studio/marketing/social"
  if (!path.startsWith("/")) return "/studio/marketing/social"
  if (path.startsWith("//")) return "/studio/marketing/social"
  return path
}

type ProviderConfig = {
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  defaultScopes: string
  redirectUriOverride?: string
}

export function getProviderConfig(platform: SocialPlatform): ProviderConfig {
  if (platform === "INSTAGRAM") {
    return {
      clientId: process.env.SOCIAL_INSTAGRAM_CLIENT_ID || "",
      clientSecret: process.env.SOCIAL_INSTAGRAM_CLIENT_SECRET || "",
      authorizeUrl: process.env.SOCIAL_INSTAGRAM_AUTHORIZE_URL || "https://api.instagram.com/oauth/authorize",
      tokenUrl: process.env.SOCIAL_INSTAGRAM_TOKEN_URL || "https://api.instagram.com/oauth/access_token",
      defaultScopes: process.env.SOCIAL_INSTAGRAM_SCOPES || "user_profile,user_media",
      redirectUriOverride: process.env.SOCIAL_INSTAGRAM_REDIRECT_URI,
    }
  }

  return {
    clientId: process.env.SOCIAL_TIKTOK_CLIENT_KEY || "",
    clientSecret: process.env.SOCIAL_TIKTOK_CLIENT_SECRET || "",
    authorizeUrl: process.env.SOCIAL_TIKTOK_AUTHORIZE_URL || "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: process.env.SOCIAL_TIKTOK_TOKEN_URL || "https://open.tiktokapis.com/v2/oauth/token/",
    defaultScopes: process.env.SOCIAL_TIKTOK_SCOPES || "user.info.basic,video.list",
    redirectUriOverride: process.env.SOCIAL_TIKTOK_REDIRECT_URI,
  }
}

export function missingProviderEnv(platform: SocialPlatform) {
  const config = getProviderConfig(platform)
  const missing: string[] = []
  if (!config.clientId) {
    missing.push(platform === "INSTAGRAM" ? "SOCIAL_INSTAGRAM_CLIENT_ID" : "SOCIAL_TIKTOK_CLIENT_KEY")
  }
  if (!config.clientSecret) {
    missing.push(platform === "INSTAGRAM" ? "SOCIAL_INSTAGRAM_CLIENT_SECRET" : "SOCIAL_TIKTOK_CLIENT_SECRET")
  }
  if (!getStateSecret()) {
    missing.push("SOCIAL_OAUTH_STATE_SECRET (or NEXTAUTH_SECRET)")
  }
  return missing
}

export function resolveOauthReturnPath(ownerType: SocialOwnerType, explicitPath: string | null) {
  if (explicitPath) return sanitizeReturnPath(explicitPath)
  return ownerType === "TEACHER" ? "/teacher/social" : "/studio/marketing/social"
}

export function resolveCallbackUrl(request: NextRequest, platform: SocialPlatform) {
  const config = getProviderConfig(platform)
  if (config.redirectUriOverride) return config.redirectUriOverride
  return `${request.nextUrl.origin}/api/social-media/oauth/callback/${platform.toLowerCase()}`
}

export function buildAuthorizeUrl(params: {
  platform: SocialPlatform
  request: NextRequest
  state: string
}) {
  const config = getProviderConfig(params.platform)
  const redirectUri = resolveCallbackUrl(params.request, params.platform)
  const url = new URL(config.authorizeUrl)

  if (params.platform === "INSTAGRAM") {
    url.searchParams.set("client_id", config.clientId)
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("scope", config.defaultScopes)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("state", params.state)
    return url.toString()
  }

  url.searchParams.set("client_key", config.clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", config.defaultScopes)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("state", params.state)
  return url.toString()
}

type InstagramExchangeResponse = {
  access_token: string
  user_id: number
}

type InstagramLongLivedResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
}

type InstagramProfileResponse = {
  id: string
  username: string
  media_count?: number
  account_type?: string
}

type TikTokTokenResponse = {
  access_token: string
  expires_in?: number
  refresh_token?: string
  refresh_expires_in?: number
  open_id?: string
  scope?: string
}

type TikTokProfileResponse = {
  data?: {
    user?: {
      open_id?: string
      union_id?: string
      avatar_url?: string
      display_name?: string
      username?: string
      follower_count?: number
      following_count?: number
      likes_count?: number
      video_count?: number
    }
  }
}

function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export async function exchangeInstagramCode(request: NextRequest, code: string) {
  const config = getProviderConfig("INSTAGRAM")
  const redirectUri = resolveCallbackUrl(request, "INSTAGRAM")

  const payload = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  })

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  })

  if (!tokenResponse.ok) {
    throw new Error(`Instagram token exchange failed (${tokenResponse.status})`)
  }

  const tokenData = (await tokenResponse.json()) as InstagramExchangeResponse
  let accessToken = tokenData.access_token
  let expiresInSeconds = 60 * 60

  try {
    const longLivedUrl = new URL("https://graph.instagram.com/access_token")
    longLivedUrl.searchParams.set("grant_type", "ig_exchange_token")
    longLivedUrl.searchParams.set("client_secret", config.clientSecret)
    longLivedUrl.searchParams.set("access_token", accessToken)

    const longLivedResponse = await fetch(longLivedUrl.toString())
    if (longLivedResponse.ok) {
      const longLivedData = (await longLivedResponse.json()) as InstagramLongLivedResponse
      if (longLivedData.access_token) {
        accessToken = longLivedData.access_token
      }
      if (longLivedData.expires_in) {
        expiresInSeconds = longLivedData.expires_in
      }
    }
  } catch {
    // Keep short-lived token if long-lived exchange fails.
  }

  const profileUrl = new URL("https://graph.instagram.com/me")
  profileUrl.searchParams.set("fields", "id,username,media_count,account_type")
  profileUrl.searchParams.set("access_token", accessToken)
  const profileResponse = await fetch(profileUrl.toString())
  if (!profileResponse.ok) {
    throw new Error(`Instagram profile fetch failed (${profileResponse.status})`)
  }
  const profile = (await profileResponse.json()) as InstagramProfileResponse

  return {
    platformUserId: profile.id || String(tokenData.user_id),
    username: profile.username || `instagram_${tokenData.user_id}`,
    displayName: profile.username || null,
    profilePicture: null,
    followerCount: 0,
    followingCount: 0,
    postsCount: safeNumber(profile.media_count),
    accessToken,
    refreshToken: null,
    tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  }
}

export async function exchangeTikTokCode(request: NextRequest, code: string) {
  const config = getProviderConfig("TIKTOK")
  const redirectUri = resolveCallbackUrl(request, "TIKTOK")

  const payload = new URLSearchParams({
    client_key: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  })

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  })

  if (!tokenResponse.ok) {
    throw new Error(`TikTok token exchange failed (${tokenResponse.status})`)
  }

  const tokenData = (await tokenResponse.json()) as TikTokTokenResponse
  if (!tokenData.access_token) {
    throw new Error("TikTok token response missing access_token")
  }

  const profileResponse = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  )

  if (!profileResponse.ok) {
    throw new Error(`TikTok profile fetch failed (${profileResponse.status})`)
  }

  const profileData = (await profileResponse.json()) as TikTokProfileResponse
  const profile = profileData.data?.user
  if (!profile?.open_id) {
    throw new Error("TikTok profile response missing open_id")
  }

  return {
    platformUserId: profile.open_id,
    username: profile.username || `tiktok_${profile.open_id.slice(-6)}`,
    displayName: profile.display_name || profile.username || null,
    profilePicture: profile.avatar_url || null,
    followerCount: safeNumber(profile.follower_count),
    followingCount: safeNumber(profile.following_count),
    postsCount: safeNumber(profile.video_count),
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    tokenExpiresAt: new Date(Date.now() + safeNumber(tokenData.expires_in || 3600) * 1000),
  }
}


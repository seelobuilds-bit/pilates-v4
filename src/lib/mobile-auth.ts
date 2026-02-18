import { verify, sign } from "jsonwebtoken"

const MOBILE_JWT_SECRET =
  process.env.MOBILE_JWT_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ""

const MOBILE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

export type MobileActorType = "USER" | "CLIENT"
export type MobileRole = "OWNER" | "TEACHER" | "CLIENT"

export interface MobileTokenPayload {
  sub: string
  actorType: MobileActorType
  role: MobileRole
  studioId: string
  studioSubdomain: string
  email: string
  firstName: string
  lastName: string
  teacherId?: string | null
  clientId?: string | null
  iat?: number
  exp?: number
}

export function isMobileAuthConfigured() {
  return MOBILE_JWT_SECRET.length > 0
}

export function signMobileToken(
  payload: Omit<MobileTokenPayload, "iat" | "exp">
): string | null {
  if (!isMobileAuthConfigured()) {
    console.error("MOBILE_JWT_SECRET (or JWT_SECRET/NEXTAUTH_SECRET fallback) is not configured")
    return null
  }

  return sign(payload, MOBILE_JWT_SECRET, {
    expiresIn: MOBILE_TOKEN_TTL_SECONDS,
  })
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  if (!isMobileAuthConfigured()) {
    console.error("MOBILE_JWT_SECRET (or JWT_SECRET/NEXTAUTH_SECRET fallback) is not configured")
    return null
  }

  try {
    return verify(token, MOBILE_JWT_SECRET) as MobileTokenPayload
  } catch {
    return null
  }
}

export function getMobileTokenTtlSeconds() {
  return MOBILE_TOKEN_TTL_SECONDS
}

export function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) return null
  const [scheme, token] = authorizationHeader.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}

import { extractBearerToken, verifyMobileToken, type MobileTokenPayload } from "./mobile-auth"
import { fetchStudioBrandingSummary, type StudioBrandingSummary } from "./studio-read-models"

export type MobileTokenContext =
  | {
      ok: true
      decoded: MobileTokenPayload
    }
  | {
      ok: false
      reason: "missing_token" | "invalid_token"
    }

export type MobileStudioAuthContext =
  | {
      ok: true
      decoded: MobileTokenPayload
      studio: StudioBrandingSummary
    }
  | {
      ok: false
      reason: "missing_token" | "invalid_token" | "studio_not_found"
    }

export function resolveMobileTokenContext(
  authorizationHeader: string | null
): MobileTokenContext {
  const token = extractBearerToken(authorizationHeader)
  if (!token) {
    return { ok: false, reason: "missing_token" }
  }

  const decoded = verifyMobileToken(token)
  if (!decoded) {
    return { ok: false, reason: "invalid_token" }
  }

  return {
    ok: true,
    decoded,
  }
}

export async function resolveMobileStudioAuthContext(
  authorizationHeader: string | null
): Promise<MobileStudioAuthContext> {
  const auth = resolveMobileTokenContext(authorizationHeader)
  if (!auth.ok) {
    return auth
  }

  const studio = await fetchStudioBrandingSummary(auth.decoded.studioId)
  if (!studio || studio.subdomain !== auth.decoded.studioSubdomain) {
    return { ok: false, reason: "studio_not_found" }
  }

  return {
    ok: true,
    decoded: auth.decoded,
    studio,
  }
}

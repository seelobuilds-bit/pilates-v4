import { extractBearerToken, verifyMobileToken, type MobileTokenPayload } from "./mobile-auth"
import { fetchStudioBrandingSummary, type StudioBrandingSummary } from "./studio-read-models"

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

export async function resolveMobileStudioAuthContext(
  authorizationHeader: string | null
): Promise<MobileStudioAuthContext> {
  const token = extractBearerToken(authorizationHeader)
  if (!token) {
    return { ok: false, reason: "missing_token" }
  }

  const decoded = verifyMobileToken(token)
  if (!decoded) {
    return { ok: false, reason: "invalid_token" }
  }

  const studio = await fetchStudioBrandingSummary(decoded.studioId)
  if (!studio || studio.subdomain !== decoded.studioSubdomain) {
    return { ok: false, reason: "studio_not_found" }
  }

  return {
    ok: true,
    decoded,
    studio,
  }
}

import { type MobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { MobileReportsError } from "./mobile-report-errors"

export function assertMobileReportsAuth(
  auth: MobileStudioAuthContext
): asserts auth is Extract<MobileStudioAuthContext, { ok: true }> {
  if (auth.ok) return

  if (auth.reason === "missing_token") {
    throw new MobileReportsError("Missing bearer token", 401)
  }
  if (auth.reason === "invalid_token") {
    throw new MobileReportsError("Invalid token", 401)
  }
  throw new MobileReportsError("Studio not found", 401)
}

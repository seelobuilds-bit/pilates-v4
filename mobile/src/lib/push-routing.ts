export type MobilePushRoute = "/(app)" | "/(app)/schedule" | "/(app)/inbox" | "/(app)/workspace" | "/(app)/profile"

export function routeFromPushPayload(data: unknown): MobilePushRoute | null {
  if (!data || typeof data !== "object") return null
  const type = String((data as { type?: unknown }).type || "").trim().toLowerCase()

  if (type === "mobile_inbox_message") {
    return "/(app)/inbox"
  }

  if (type === "mobile_booking_created" || type === "mobile_booking_reactivated" || type === "mobile_booking_cancelled") {
    return "/(app)/schedule"
  }

  if (type === "mobile_push_test") {
    return "/(app)/profile"
  }

  return null
}

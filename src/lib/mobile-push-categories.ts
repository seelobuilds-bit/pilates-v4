export type MobilePushCategory = "INBOX" | "BOOKINGS" | "SYSTEM"

export const MOBILE_PUSH_DEFAULT_CATEGORIES: MobilePushCategory[] = ["INBOX", "BOOKINGS", "SYSTEM"]

const MOBILE_PUSH_CATEGORY_SET = new Set<MobilePushCategory>(MOBILE_PUSH_DEFAULT_CATEGORIES)

export function normalizeMobilePushCategories(value: unknown): MobilePushCategory[] {
  if (!Array.isArray(value)) {
    return [...MOBILE_PUSH_DEFAULT_CATEGORIES]
  }

  if (value.length === 0) {
    return []
  }

  const inputValues = value.map((item) => String(item || "").trim().toUpperCase())
  const deduped = new Set(inputValues.filter((item): item is MobilePushCategory => MOBILE_PUSH_CATEGORY_SET.has(item as MobilePushCategory)))
  if (deduped.size === 0) {
    return [...MOBILE_PUSH_DEFAULT_CATEGORIES]
  }

  return MOBILE_PUSH_DEFAULT_CATEGORIES.filter((item) => deduped.has(item))
}

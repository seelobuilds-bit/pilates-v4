export const MANUAL_OVERRIDE_KEEP_ACTIVE_TOKEN = "__manual_override_keep_active__"
export const MANUAL_OVERRIDE_END_AT_RANGE_TOKEN = "__manual_override_end_at_range__"
export const SYSTEM_AUTO_FINALIZE_TOKEN = "__system_auto_finalize__"

export function isManualKeepActiveOverride(value: string | null | undefined) {
  return value === MANUAL_OVERRIDE_KEEP_ACTIVE_TOKEN
}

export function isManualEndAtRangeOverride(value: string | null | undefined) {
  return value === MANUAL_OVERRIDE_END_AT_RANGE_TOKEN
}

import { normalizeHexColor } from "@/lib/brand-color"

export const DEMO_THEME_PRIMARY_COLOR_COOKIE = "current_demo_primary_color"

export function resolveDemoThemePrimaryColor(value: string | null | undefined) {
  return normalizeHexColor(value) || null
}

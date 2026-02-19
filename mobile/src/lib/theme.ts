import { mobileConfig } from "@/src/lib/config"

export const mobileTheme = {
  radius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14,
  },
  colors: {
    canvas: "#f8fafc",
    surface: "#ffffff",
    border: "#e2e8f0",
    borderMuted: "#cbd5e1",
    text: "#0f172a",
    textMuted: "#334155",
    textSubtle: "#64748b",
    textFaint: "#475569",
    danger: "#dc2626",
    success: "#16a34a",
  },
}

export function getStudioPrimaryColor() {
  const candidate = String(mobileConfig.primaryColor || "").trim()
  return candidate || "#7c3aed"
}

export function withOpacity(hexColor: string, opacity: number) {
  const hex = hexColor.replace("#", "").trim()
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return hexColor
  }

  const normalized = Math.max(0, Math.min(1, opacity))
  const alpha = Math.round(normalized * 255)
    .toString(16)
    .padStart(2, "0")
  return `#${hex}${alpha}`
}

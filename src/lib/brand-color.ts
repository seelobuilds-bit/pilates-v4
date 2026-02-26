const DEFAULT_STUDIO_PRIMARY_COLOR = "#7c3aed"

type Rgb = { r: number; g: number; b: number }

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function expandHex(hex: string) {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  return hex
}

export function normalizeHexColor(value: string | null | undefined) {
  const candidate = String(value || "").trim().toLowerCase()
  const expanded = expandHex(candidate)
  if (!/^#[0-9a-f]{6}$/.test(expanded)) {
    return null
  }
  return expanded
}

function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHexColor(hex) || DEFAULT_STUDIO_PRIMARY_COLOR
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

function rgbToHex(rgb: Rgb) {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`
}

function mixRgb(from: Rgb, to: Rgb, weight: number): Rgb {
  const w = Math.max(0, Math.min(1, weight))
  return {
    r: clampChannel(from.r * (1 - w) + to.r * w),
    g: clampChannel(from.g * (1 - w) + to.g * w),
    b: clampChannel(from.b * (1 - w) + to.b * w),
  }
}

function rgbToHsl(rgb: Rgb) {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  let hue = 0
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6
    } else if (max === g) {
      hue = (b - r) / delta + 2
    } else {
      hue = (r - g) / delta + 4
    }
  }

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  const normalizedHue = ((hue * 60) + 360) % 360

  return {
    h: Math.round(normalizedHue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

function buildShades(hex: string) {
  const base = hexToRgb(hex)
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }

  return {
    50: rgbToHex(mixRgb(base, white, 0.92)),
    100: rgbToHex(mixRgb(base, white, 0.84)),
    200: rgbToHex(mixRgb(base, white, 0.72)),
    300: rgbToHex(mixRgb(base, white, 0.52)),
    400: rgbToHex(mixRgb(base, white, 0.3)),
    500: rgbToHex(mixRgb(base, white, 0.14)),
    600: rgbToHex(base),
    700: rgbToHex(mixRgb(base, black, 0.14)),
    800: rgbToHex(mixRgb(base, black, 0.28)),
    900: rgbToHex(mixRgb(base, black, 0.42)),
    950: rgbToHex(mixRgb(base, black, 0.54)),
  } as const
}

export function resolveStudioPrimaryColor(primaryColor: string | null | undefined) {
  return normalizeHexColor(primaryColor) || DEFAULT_STUDIO_PRIMARY_COLOR
}

export function buildStudioBrandCssVariables(primaryColor: string | null | undefined) {
  const resolvedPrimary = resolveStudioPrimaryColor(primaryColor)
  const shades = buildShades(resolvedPrimary)
  const hsl = rgbToHsl(hexToRgb(resolvedPrimary))

  return {
    "--studio-50": shades[50],
    "--studio-100": shades[100],
    "--studio-200": shades[200],
    "--studio-300": shades[300],
    "--studio-400": shades[400],
    "--studio-500": shades[500],
    "--studio-600": shades[600],
    "--studio-700": shades[700],
    "--studio-800": shades[800],
    "--studio-900": shades[900],
    "--studio-950": shades[950],
    "--primary": `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    "--ring": `${hsl.h} ${hsl.s}% ${hsl.l}%`,
  } as Record<string, string>
}

export const EMBED_FONT_OPTIONS = [
  {
    key: "inter",
    label: "Inter (Default)",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  {
    key: "system",
    label: "System Sans",
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  {
    key: "clean",
    label: "Helvetica/Arial",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  {
    key: "classic",
    label: "Georgia Serif",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    key: "mono",
    label: "Mono",
    fontFamily: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
] as const

export type EmbedFontKey = (typeof EMBED_FONT_OPTIONS)[number]["key"]

const EMBED_FONT_MAP: Record<EmbedFontKey, string> = EMBED_FONT_OPTIONS.reduce(
  (acc, option) => {
    acc[option.key] = option.fontFamily
    return acc
  },
  {} as Record<EmbedFontKey, string>
)

export function isEmbedFontKey(value: string | null | undefined): value is EmbedFontKey {
  if (!value) return false
  return value in EMBED_FONT_MAP
}

export function resolveEmbedFontFamily(value: string | null | undefined) {
  if (isEmbedFontKey(value)) {
    return EMBED_FONT_MAP[value]
  }
  return EMBED_FONT_MAP.inter
}

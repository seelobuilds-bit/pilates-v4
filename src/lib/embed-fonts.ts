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
  {
    key: "poppins",
    label: "Poppins (Google)",
    fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "montserrat",
    label: "Montserrat (Google)",
    fontFamily: "'Montserrat', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "dm-sans",
    label: "DM Sans (Google)",
    fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&display=swap",
  },
  {
    key: "manrope",
    label: "Manrope (Google)",
    fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "open-sans",
    label: "Open Sans (Google)",
    fontFamily: "'Open Sans', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "lato",
    label: "Lato (Google)",
    fontFamily: "'Lato', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
  },
  {
    key: "nunito",
    label: "Nunito (Google)",
    fontFamily: "'Nunito', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap",
  },
  {
    key: "raleway",
    label: "Raleway (Google)",
    fontFamily: "'Raleway', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "playfair",
    label: "Playfair Display (Google)",
    fontFamily: "'Playfair Display', Georgia, serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
  },
  {
    key: "merriweather",
    label: "Merriweather (Google)",
    fontFamily: "'Merriweather', Georgia, serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap",
  },
  {
    key: "source-sans",
    label: "Source Sans 3 (Google)",
    fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "roboto",
    label: "Roboto (Google)",
    fontFamily: "'Roboto', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
  },
  {
    key: "work-sans",
    label: "Work Sans (Google)",
    fontFamily: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap",
  },
  {
    key: "rubik",
    label: "Rubik (Google)",
    fontFamily: "'Rubik', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap",
  },
  {
    key: "oswald",
    label: "Oswald (Google)",
    fontFamily: "'Oswald', ui-sans-serif, system-ui, sans-serif",
    googleHref: "https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap",
  },
] as const

export type EmbedFontKey = (typeof EMBED_FONT_OPTIONS)[number]["key"]

const EMBED_FONT_MAP: Record<
  EmbedFontKey,
  { fontFamily: string; googleHref?: string }
> = EMBED_FONT_OPTIONS.reduce(
  (acc, option) => {
    acc[option.key] = {
      fontFamily: option.fontFamily,
      googleHref: "googleHref" in option ? option.googleHref : undefined,
    }
    return acc
  },
  {} as Record<EmbedFontKey, { fontFamily: string; googleHref?: string }>
)

export function isEmbedFontKey(value: string | null | undefined): value is EmbedFontKey {
  if (!value) return false
  return value in EMBED_FONT_MAP
}

export function resolveEmbedFontKey(value: string | null | undefined): EmbedFontKey {
  if (isEmbedFontKey(value)) return value
  return "inter"
}

export function resolveEmbedFontFamily(value: string | null | undefined) {
  const key = resolveEmbedFontKey(value)
  return EMBED_FONT_MAP[key].fontFamily
}

export function resolveEmbedFontGoogleHref(value: string | null | undefined) {
  const key = resolveEmbedFontKey(value)
  return EMBED_FONT_MAP[key].googleHref || null
}

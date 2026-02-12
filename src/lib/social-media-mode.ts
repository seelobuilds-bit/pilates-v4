export type SocialMediaMode = "SIMULATED_BETA" | "LIVE"

const DEFAULT_MODE: SocialMediaMode = "SIMULATED_BETA"

function normalizeMode(value: string | undefined): SocialMediaMode {
  const normalized = value?.trim().toUpperCase()
  if (normalized === "LIVE") return "LIVE"
  if (normalized === "SIMULATED_BETA") return "SIMULATED_BETA"
  return DEFAULT_MODE
}

export function getSocialMediaMode(): SocialMediaMode {
  return normalizeMode(process.env.SOCIAL_MEDIA_MODE)
}

export function getPublicSocialMediaMode(): SocialMediaMode {
  return normalizeMode(process.env.NEXT_PUBLIC_SOCIAL_MEDIA_MODE || process.env.SOCIAL_MEDIA_MODE)
}

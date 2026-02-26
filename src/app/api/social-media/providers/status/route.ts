import { NextResponse } from "next/server"
import { getSocialMediaMode } from "@/lib/social-media-mode"
import { getSession } from "@/lib/session"
import { missingProviderEnv } from "@/lib/social/oauth"

export async function GET() {
  const session = await getSession()
  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const mode = getSocialMediaMode()
  const instagramMissing = missingProviderEnv("INSTAGRAM")
  const tiktokMissing = missingProviderEnv("TIKTOK")

  return NextResponse.json({
    mode,
    liveEnabled: mode === "LIVE",
    providers: {
      instagram: {
        ready: instagramMissing.length === 0,
        missingEnv: instagramMissing,
      },
      tiktok: {
        ready: tiktokMissing.length === 0,
        missingEnv: tiktokMissing,
      },
    },
    transcribe: {
      enabled: Boolean(process.env.SOCIAL_TRANSCRIBE_API_URL),
      providerUrlConfigured: Boolean(process.env.SOCIAL_TRANSCRIBE_API_URL),
    },
    hookAi: {
      enabled: process.env.SOCIAL_HOOK_AI_ENABLED === "1",
      openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.SOCIAL_HOOK_AI_MODEL || "gpt-4o-mini",
    },
    trendingIngest: {
      provider: process.env.SOCIAL_TRENDING_PROVIDER || "none",
      customSourceConfigured: Boolean(process.env.SOCIAL_TRENDING_SOURCE_URL),
      apifyConfigured: Boolean(process.env.SOCIAL_TRENDING_APIFY_TOKEN && process.env.SOCIAL_TRENDING_APIFY_ACTOR_ID),
    },
  })
}


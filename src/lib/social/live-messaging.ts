import { SocialPlatform } from "@prisma/client"

type SendResult =
  | { ok: true; providerMessageId: string | null }
  | { ok: false; error: string; status?: number }

type AccountForSend = {
  platform: SocialPlatform
  platformUserId: string
  accessToken: string
}

type SendInput = {
  account: AccountForSend
  recipientPlatformUserId: string
  content: string
}

function isConfigured(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

async function sendInstagramMessage(input: SendInput): Promise<SendResult> {
  if (process.env.SOCIAL_INSTAGRAM_MESSAGES_ENABLED !== "1") {
    return { ok: false, error: "Instagram live messaging is disabled (SOCIAL_INSTAGRAM_MESSAGES_ENABLED != 1)" }
  }

  const graphBase = process.env.SOCIAL_INSTAGRAM_GRAPH_API_BASE_URL || "https://graph.facebook.com/v21.0"
  const endpoint = new URL(`${graphBase.replace(/\/+$/, "")}/${input.account.platformUserId}/messages`)
  endpoint.searchParams.set("access_token", input.account.accessToken)

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "instagram",
      recipient: { id: input.recipientPlatformUserId },
      message: { text: input.content },
    }),
  })

  const payload = await response.json().catch(() => ({})) as { message_id?: string; error?: { message?: string } }
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload?.error?.message || `Instagram API send failed (${response.status})`,
    }
  }

  return {
    ok: true,
    providerMessageId: payload.message_id || null,
  }
}

async function sendTikTokMessage(input: SendInput): Promise<SendResult> {
  const endpoint = process.env.SOCIAL_TIKTOK_SEND_MESSAGE_URL
  if (!isConfigured(endpoint)) {
    return { ok: false, error: "TikTok live messaging endpoint is not configured (SOCIAL_TIKTOK_SEND_MESSAGE_URL)" }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  const staticToken = process.env.SOCIAL_TIKTOK_SEND_MESSAGE_TOKEN
  if (isConfigured(staticToken)) {
    headers.Authorization = `Bearer ${staticToken}`
  } else {
    headers.Authorization = `Bearer ${input.account.accessToken}`
  }

  const response = await fetch(endpoint!, {
    method: "POST",
    headers,
    body: JSON.stringify({
      recipientPlatformUserId: input.recipientPlatformUserId,
      content: input.content,
      senderPlatformUserId: input.account.platformUserId,
    }),
  })

  const payload = await response.json().catch(() => ({})) as { id?: string; messageId?: string; error?: string }
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload.error || `TikTok API send failed (${response.status})`,
    }
  }

  return {
    ok: true,
    providerMessageId: payload.messageId || payload.id || null,
  }
}

export async function sendLiveSocialMessage(input: SendInput): Promise<SendResult> {
  if (input.account.platform === SocialPlatform.INSTAGRAM) {
    return sendInstagramMessage(input)
  }
  if (input.account.platform === SocialPlatform.TIKTOK) {
    return sendTikTokMessage(input)
  }
  return { ok: false, error: `Unsupported platform ${input.account.platform}` }
}


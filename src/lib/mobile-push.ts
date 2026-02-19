import { db } from "@/lib/db"
import type { MobilePushCategory } from "@/lib/mobile-push-categories"

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send"
const EXPO_PUSH_ACCESS_TOKEN = String(process.env.EXPO_PUSH_ACCESS_TOKEN || "").trim()
const EXPO_MAX_BATCH = 100

type PushRole = "OWNER" | "TEACHER" | "CLIENT"

type PushTarget = {
  studioId: string
  userIds?: string[]
  clientIds?: string[]
  roles?: PushRole[]
  category?: MobilePushCategory
}

export interface SendMobilePushParams extends PushTarget {
  title: string
  body: string
  data?: Record<string, unknown>
}

export interface SendMobilePushResult {
  attempted: number
  sent: number
  failed: number
  disabled: number
}

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))))
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function clipPushText(value: string, max = 180) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}…`
}

function isCategoryEnabledForDevice(
  notificationCategories: MobilePushCategory[] | null | undefined,
  category?: MobilePushCategory
) {
  if (!category) {
    return true
  }

  if (!Array.isArray(notificationCategories)) {
    // Backwards-safe behavior for legacy rows.
    return true
  }

  return notificationCategories.includes(category)
}

async function findTokens(target: PushTarget) {
  const userIds = uniq(target.userIds || [])
  const clientIds = uniq(target.clientIds || [])

  if (userIds.length === 0 && clientIds.length === 0 && (!target.roles || target.roles.length === 0)) {
    return []
  }

  const devices = await db.mobilePushDevice.findMany({
    where: {
      studioId: target.studioId,
      isEnabled: true,
      ...(target.roles && target.roles.length > 0 ? { role: { in: target.roles } } : {}),
      ...(
        userIds.length > 0 && clientIds.length > 0
          ? {
              OR: [
                { userId: { in: userIds } },
                { clientId: { in: clientIds } },
              ],
            }
          : {}
      ),
      ...(userIds.length > 0 && clientIds.length === 0 ? { userId: { in: userIds } } : {}),
      ...(clientIds.length > 0 && userIds.length === 0 ? { clientId: { in: clientIds } } : {}),
    },
    select: {
      expoPushToken: true,
      notificationCategories: true,
    },
  })

  return devices.filter((device) => isCategoryEnabledForDevice(device.notificationCategories, target.category))
}

export async function sendMobilePushNotification(params: SendMobilePushParams): Promise<SendMobilePushResult> {
  const targetDevices = await findTokens(params)
  const tokens = uniq(targetDevices.map((device) => device.expoPushToken))

  if (tokens.length === 0) {
    return { attempted: 0, sent: 0, failed: 0, disabled: 0 }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  if (EXPO_PUSH_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${EXPO_PUSH_ACCESS_TOKEN}`
  }

  let sent = 0
  let failed = 0
  const invalidTokens = new Set<string>()
  const body = clipPushText(params.body)
  const title = clipPushText(params.title, 80)

  for (const tokenBatch of chunkArray(tokens, EXPO_MAX_BATCH)) {
    const messages = tokenBatch.map((to) => ({
      to,
      sound: "default",
      title,
      body,
      data: params.data || {},
    }))

    try {
      const response = await fetch(EXPO_PUSH_SEND_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(messages),
      })

      if (!response.ok) {
        failed += tokenBatch.length
        console.error("Expo push send failed", {
          status: response.status,
          statusText: response.statusText,
          studioId: params.studioId,
        })
        continue
      }

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: Array<{
              status?: string
              details?: { error?: string }
            }>
          }
        | null

      const results = Array.isArray(payload?.data) ? payload.data : []
      for (let i = 0; i < tokenBatch.length; i += 1) {
        const token = tokenBatch[i]
        const result = results[i]

        if (result?.status === "ok") {
          sent += 1
          continue
        }

        failed += 1
        if (result?.details?.error === "DeviceNotRegistered") {
          invalidTokens.add(token)
        }
      }
    } catch (error) {
      failed += tokenBatch.length
      console.error("Expo push send error", {
        studioId: params.studioId,
        error,
      })
    }
  }

  let disabled = 0
  if (invalidTokens.size > 0) {
    const disabledResult = await db.mobilePushDevice.updateMany({
      where: {
        studioId: params.studioId,
        expoPushToken: { in: Array.from(invalidTokens) },
      },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
      },
    })
    disabled = disabledResult.count
  }

  return {
    attempted: tokens.length,
    sent,
    failed,
    disabled,
  }
}

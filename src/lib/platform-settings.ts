import { createHmac, timingSafeEqual } from "crypto"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

const PLATFORM_SETTINGS_KEY = "default"
const SITE_LOCK_COOKIE = "current-site-access"
const SITE_LOCK_COOKIE_MAX_AGE = 60 * 60 * 24 * 14
export const DEFAULT_SITE_LOCK_PASSWORD = "CURRENTPreview2026!"

function cookieSecret() {
  return process.env.NEXTAUTH_SECRET || "current-site-lock"
}

function createSiteLockToken(hash: string) {
  return createHmac("sha256", cookieSecret()).update(`site-lock:${hash}`).digest("hex")
}

function safeEqualString(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

async function createDefaultSettings() {
  const siteLockPasswordHash = await bcrypt.hash(DEFAULT_SITE_LOCK_PASSWORD, 10)

  return db.platformSetting.create({
    data: {
      singletonKey: PLATFORM_SETTINGS_KEY,
      siteLockEnabled: true,
      siteLockPasswordHash,
    },
  })
}

export async function getPlatformSettings() {
  const existing = await db.platformSetting.findUnique({
    where: { singletonKey: PLATFORM_SETTINGS_KEY },
  })

  if (existing) {
    if (existing.siteLockPasswordHash) {
      return existing
    }

    const siteLockPasswordHash = await bcrypt.hash(DEFAULT_SITE_LOCK_PASSWORD, 10)
    return db.platformSetting.update({
      where: { id: existing.id },
      data: { siteLockPasswordHash },
    })
  }

  return createDefaultSettings()
}

export async function updatePlatformSettings(input: {
  siteLockEnabled: boolean
  siteLockPassword?: string
}) {
  const current = await getPlatformSettings()
  const data: {
    siteLockEnabled: boolean
    siteLockPasswordHash?: string
  } = {
    siteLockEnabled: input.siteLockEnabled,
  }

  if (input.siteLockPassword && input.siteLockPassword.trim().length > 0) {
    data.siteLockPasswordHash = await bcrypt.hash(input.siteLockPassword.trim(), 10)
  }

  return db.platformSetting.update({
    where: { id: current.id },
    data,
  })
}

export async function verifySiteLockPassword(password: string) {
  const settings = await getPlatformSettings()
  const passwordHash = settings.siteLockPasswordHash

  if (!passwordHash) {
    return false
  }

  return bcrypt.compare(password, passwordHash)
}

export async function hasValidSiteLockAccess() {
  const settings = await getPlatformSettings()

  if (!settings.siteLockEnabled || !settings.siteLockPasswordHash) {
    return true
  }

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(SITE_LOCK_COOKIE)?.value
  if (!cookieValue) {
    return false
  }

  const expected = createSiteLockToken(settings.siteLockPasswordHash)
  return safeEqualString(cookieValue, expected)
}

export async function createSiteLockCookieValue() {
  const settings = await getPlatformSettings()
  if (!settings.siteLockPasswordHash) {
    throw new Error("Site lock password is not configured")
  }

  return createSiteLockToken(settings.siteLockPasswordHash)
}

export function getSiteLockCookieConfig(value: string) {
  return {
    name: SITE_LOCK_COOKIE,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SITE_LOCK_COOKIE_MAX_AGE,
    },
  }
}


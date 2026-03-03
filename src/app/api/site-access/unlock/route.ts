import { NextResponse } from "next/server"
import {
  createSiteLockCookieValue,
  getPlatformSettings,
  getSiteLockCookieConfig,
  verifySiteLockPassword,
} from "@/lib/platform-settings"

export async function POST(request: Request) {
  try {
    const settings = await getPlatformSettings()
    if (!settings.siteLockEnabled) {
      return NextResponse.json({ unlocked: true })
    }

    const body = (await request.json().catch(() => null)) as { password?: string } | null
    const password = String(body?.password || "").trim()

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 })
    }

    const isValid = await verifySiteLockPassword(password)
    if (!isValid) {
      return NextResponse.json({ error: "Password not recognised." }, { status: 401 })
    }

    const response = NextResponse.json({ unlocked: true })
    const cookie = await createSiteLockCookieValue()
    response.cookies.set(getSiteLockCookieConfig(cookie))
    return response
  } catch (error) {
    console.error("Failed to unlock site access:", error)
    return NextResponse.json({ error: "Could not unlock the site." }, { status: 500 })
  }
}

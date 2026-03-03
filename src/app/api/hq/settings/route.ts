import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPlatformSettings, updatePlatformSettings } from "@/lib/platform-settings"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const settings = await getPlatformSettings()

  return NextResponse.json({
    siteLockEnabled: settings.siteLockEnabled,
    hasSiteLockPassword: Boolean(settings.siteLockPasswordHash),
  })
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    siteLockEnabled?: boolean
    siteLockPassword?: string
  } | null

  if (typeof body?.siteLockEnabled !== "boolean") {
    return NextResponse.json({ error: "siteLockEnabled is required." }, { status: 400 })
  }

  const nextSettings = await updatePlatformSettings({
    siteLockEnabled: body.siteLockEnabled,
    siteLockPassword: body.siteLockPassword,
  })

  return NextResponse.json({
    siteLockEnabled: nextSettings.siteLockEnabled,
    hasSiteLockPassword: Boolean(nextSettings.siteLockPasswordHash),
  })
}

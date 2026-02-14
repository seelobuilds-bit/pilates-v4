import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export type OwnerStudioAuthResult =
  | {
      studioId: string
      userId: string
    }
  | {
      error: NextResponse
    }

export async function requireOwnerStudioAccess(): Promise<OwnerStudioAuthResult> {
  const session = await getSession()

  if (!session?.user?.studioId || !session.user.id || session.user.role !== "OWNER") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  return {
    studioId: session.user.studioId,
    userId: session.user.id,
  }
}

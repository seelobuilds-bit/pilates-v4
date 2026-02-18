import { db } from "@/lib/db"

export const DEMO_STUDIO_SUBDOMAIN = "zenith"

export async function getDemoStudioId() {
  const studio = await db.studio.findUnique({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN },
    select: { id: true }
  })

  return studio?.id ?? null
}

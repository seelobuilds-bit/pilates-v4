import { db } from "@/lib/db"

export const DEMO_STUDIO_OWNER_EMAIL =
  process.env.DEMO_STUDIO_OWNER_EMAIL || "demo@thecurrent.app"
export const DEMO_STUDIO_SUBDOMAIN =
  process.env.DEMO_STUDIO_SUBDOMAIN || "current-demo-admin"

export type DemoStudioContext = {
  studioId: string
  studioName: string
  studioSubdomain: string
  ownerId: string
  ownerEmail: string
  ownerFirstName: string
  ownerLastName: string
}

async function findDemoStudioByOwnerEmail() {
  return db.studio.findFirst({
    where: {
      owner: {
        email: DEMO_STUDIO_OWNER_EMAIL,
      },
    },
    select: {
      id: true,
      name: true,
      subdomain: true,
      ownerId: true,
      owner: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

async function findDemoStudioBySubdomain() {
  return db.studio.findUnique({
    where: { subdomain: DEMO_STUDIO_SUBDOMAIN },
    select: {
      id: true,
      name: true,
      subdomain: true,
      ownerId: true,
      owner: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function getDemoStudioContext(): Promise<DemoStudioContext | null> {
  const studio = (await findDemoStudioByOwnerEmail()) || (await findDemoStudioBySubdomain())

  if (!studio?.owner?.email) {
    return null
  }

  return {
    studioId: studio.id,
    studioName: studio.name,
    studioSubdomain: studio.subdomain,
    ownerId: studio.ownerId,
    ownerEmail: studio.owner.email,
    ownerFirstName: studio.owner.firstName,
    ownerLastName: studio.owner.lastName,
  }
}

export async function getDemoStudioId() {
  const studio = await getDemoStudioContext()
  return studio?.studioId ?? null
}

export async function isDemoStudioId(studioId: string | null | undefined) {
  if (!studioId) return false
  const demoStudio = await getDemoStudioContext()
  return demoStudio?.studioId === studioId
}

export async function getDemoTeacherIds() {
  const studioId = await getDemoStudioId()
  if (!studioId) return []

  const teachers = await db.teacher.findMany({
    where: { studioId },
    select: { id: true },
  })

  return teachers.map((teacher) => teacher.id)
}

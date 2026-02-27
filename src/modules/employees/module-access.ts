import { db } from "@/lib/db"

export type StudioModuleAccess = {
  invoicesEnabled: boolean
  employeesEnabled: boolean
  timeOffEnabled: boolean
}

export async function getStudioModuleAccess(studioId: string): Promise<StudioModuleAccess> {
  const studio = await db.studio.findUnique({
    where: { id: studioId },
    select: {
      invoicesEnabled: true,
      employeesEnabled: true,
      timeOffEnabled: true,
    },
  })

  return {
    invoicesEnabled: studio?.invoicesEnabled !== false,
    employeesEnabled: studio?.employeesEnabled === true,
    timeOffEnabled: studio?.timeOffEnabled !== false,
  }
}

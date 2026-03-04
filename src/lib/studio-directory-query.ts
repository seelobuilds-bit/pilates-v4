import { db } from "@/lib/db"

export function fetchStudioClassTypes(studioId: string) {
  return db.classType.findMany({
    where: { studioId },
    orderBy: { name: "asc" },
  })
}

export function fetchStudioLocations(studioId: string) {
  return db.location.findMany({
    where: { studioId },
    orderBy: { name: "asc" },
  })
}

export function fetchStudioTeachers(studioId: string) {
  return db.teacher.findMany({
    where: { studioId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

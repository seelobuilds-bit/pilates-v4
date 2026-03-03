import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parsePublicApiLimit, requirePublicApiAuth, withPublicApiHeaders } from "@/lib/public-api"

export async function GET(request: NextRequest) {
  const { auth, response } = await requirePublicApiAuth(request, "teachers.read")
  if (response || !auth) return withPublicApiHeaders(response!)

  const limit = parsePublicApiLimit(request.nextUrl.searchParams.get("limit"))
  const activeOnly = request.nextUrl.searchParams.get("active") !== "false"

  const teachers = await db.teacher.findMany({
    where: {
      studioId: auth.studioId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      isActive: true,
      specialties: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return withPublicApiHeaders(
    NextResponse.json({
      data: teachers.map((teacher) => ({
        id: teacher.id,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        isActive: teacher.isActive,
        specialties: teacher.specialties,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      })),
      meta: { limit },
    })
  )
}

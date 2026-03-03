import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parsePublicApiLimit, requirePublicApiAuth, withPublicApiHeaders } from "@/lib/public-api"

export async function GET(request: NextRequest) {
  const { auth, response } = await requirePublicApiAuth(request, "class-types.read")
  if (response || !auth) return withPublicApiHeaders(response!)

  const limit = parsePublicApiLimit(request.nextUrl.searchParams.get("limit"))
  const activeOnly = request.nextUrl.searchParams.get("active") !== "false"

  const classTypes = await db.classType.findMany({
    where: {
      studioId: auth.studioId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      capacity: true,
      price: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return withPublicApiHeaders(
    NextResponse.json({
      data: classTypes,
      meta: { limit },
    })
  )
}

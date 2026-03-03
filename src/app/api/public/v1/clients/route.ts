import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parsePublicApiLimit, requirePublicApiAuth, withPublicApiHeaders } from "@/lib/public-api"

export async function GET(request: NextRequest) {
  const { auth, response } = await requirePublicApiAuth(request, "clients.read")
  if (response || !auth) return withPublicApiHeaders(response!)

  const limit = parsePublicApiLimit(request.nextUrl.searchParams.get("limit"))
  const search = String(request.nextUrl.searchParams.get("search") || "").trim()

  const clients = await db.client.findMany({
    where: {
      studioId: auth.studioId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return withPublicApiHeaders(
    NextResponse.json({
      data: clients,
      meta: { limit, search: search || null },
    })
  )
}

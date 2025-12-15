import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const studio = await db.studio.findUnique({
    where: { subdomain: params.subdomain }
  })

  if (studio) {
    cookies().delete(`client_token_${studio.subdomain}`)
  }

  return NextResponse.json({ success: true })
}

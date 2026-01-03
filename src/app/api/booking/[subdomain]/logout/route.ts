import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  
  const studio = await db.studio.findUnique({
    where: { subdomain }
  })

  if (studio) {
    const cookieStore = await cookies()
    cookieStore.delete(`client_token_${subdomain}`)
  }

  return NextResponse.json({ success: true })
}

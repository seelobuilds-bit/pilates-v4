import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  const cookieStore = await cookies()
  cookieStore.delete(`client_token_${params.subdomain}`)

  return NextResponse.json({ success: true })
}




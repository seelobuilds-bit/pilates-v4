import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret")

export async function PUT(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(`client_token_${params.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const clientId = payload.clientId as string

    const body = await request.json()
    const { firstName, lastName, phone } = body

    const client = await db.client.update({
      where: { id: clientId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    })

    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}




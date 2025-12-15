import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const studio = await db.studio.findUnique({
      where: { subdomain: params.subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const token = cookies().get(`client_token_${studio.subdomain}`)?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as { clientId: string; studioId: string }

    if (decoded.studioId !== studio.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const client = await db.client.findUnique({
      where: { id: decoded.clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email
    })
  } catch (error) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
}

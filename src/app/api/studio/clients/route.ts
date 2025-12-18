import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clients = await db.client.findMany({
    where: { studioId: session.user.studioId },
    include: {
      _count: { select: { bookings: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(clients)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, credits } = body

    // Check if client already exists at this studio
    const existingClient = await db.client.findFirst({
      where: {
        email,
        studioId: session.user.studioId
      }
    })

    if (existingClient) {
      return NextResponse.json({ error: "Client with this email already exists" }, { status: 400 })
    }

    // Create a temporary password
    const tempPassword = await bcrypt.hash("client123", 10)

    const client = await db.client.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        credits: credits || 0,
        password: tempPassword,
        studioId: session.user.studioId
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error("Failed to create client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

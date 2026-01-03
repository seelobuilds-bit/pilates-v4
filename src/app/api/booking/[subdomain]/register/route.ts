import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "studio-client-secret-key"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingClient = await db.client.findFirst({
      where: { email, studioId: studio.id }
    })

    if (existingClient) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await db.client.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        studioId: studio.id
      }
    })

    const token = sign(
      { clientId: client.id, studioId: studio.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const cookieStore = await cookies()
    cookieStore.set(`client_token_${subdomain}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
    })

    return NextResponse.json({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}

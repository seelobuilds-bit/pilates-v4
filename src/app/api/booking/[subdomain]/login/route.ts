import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { createClientToken, isJWTConfigured } from "@/lib/client-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    // Security check
    if (!isJWTConfigured()) {
      console.error("JWT_SECRET not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { subdomain } = await params
    
    const studio = await db.studio.findUnique({
      where: { subdomain },
      select: { id: true }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const parsedEmail = String(email).trim().toLowerCase()

    const client = await db.client.findFirst({
      where: {
        studioId: studio.id,
        email: {
          equals: parsedEmail,
          mode: "insensitive"
        }
      }
    })

    if (!client || !client.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, client.password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = createClientToken({
      clientId: client.id,
      studioId: studio.id,
      email: client.email
    })

    if (!token) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

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
      email: client.email,
      phone: client.phone,
      credits: client.credits,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}

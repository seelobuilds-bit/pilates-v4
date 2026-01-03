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
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const client = await db.client.findFirst({
      where: { email, studioId: studio.id }
    })

    if (!client || !client.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, client.password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}

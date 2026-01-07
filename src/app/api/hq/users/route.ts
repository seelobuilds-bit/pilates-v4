import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendEmail } from "@/lib/communications"

// POST - Create a new user (for HQ admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, firstName, lastName, role } = body

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate a setup token for password
    const setupToken = crypto.randomBytes(32).toString("hex")
    const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create user with empty password (will be set via setup link)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        role,
        password: "", // Empty - will be set via setup link
        resetToken: setupToken,
        resetTokenExpiry: setupTokenExpiry
      }
    })

    // Send setup email
    const baseUrl = process.env.NEXTAUTH_URL || "https://www.thecurrent.app"
    const setupUrl = `${baseUrl}/setup-account?token=${setupToken}`

    await sendEmail({
      to: email,
      subject: `Welcome to Current - Set Up Your Account`,
      body: `Hi ${firstName},\n\nYou've been invited to join Current as a ${role.replace("_", " ")}.\n\nPlease click the link below to set your password and access your account:\n\n${setupUrl}\n\nThis link will expire in 7 days.\n\nBest,\nThe Current Team`
    })

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      setupUrl // Include URL in case email fails
    })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

// GET - List users (for HQ admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    const users = await db.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

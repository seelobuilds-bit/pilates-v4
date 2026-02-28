import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { sendSystemTemplateEmail } from "@/lib/email"
import { createClientToken } from "@/lib/client-auth"

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
    const { email, password, firstName, lastName, phone, healthIssues, classNotes } = body

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const parsedEmail = String(email).trim().toLowerCase()
    const parsedFirstName = String(firstName).trim()
    const parsedLastName = String(lastName).trim()
    const parsedPhone = typeof phone === "string" ? phone.trim() : null
    const parsedHealthIssues = typeof healthIssues === "string" ? healthIssues.trim() : null
    const parsedClassNotes = typeof classNotes === "string" ? classNotes.trim() : null

    if (!parsedEmail || !parsedFirstName || !parsedLastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingClient = await db.client.findFirst({
      where: {
        studioId: studio.id,
        email: {
          equals: parsedEmail,
          mode: "insensitive"
        }
      }
    })

    if (existingClient) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await db.client.create({
      data: {
        email: parsedEmail,
        password: hashedPassword,
        firstName: parsedFirstName,
        lastName: parsedLastName,
        phone: parsedPhone || null,
        healthIssues: parsedHealthIssues || null,
        classNotes: parsedClassNotes || null,
        studioId: studio.id
      }
    })

    const token = createClientToken({ clientId: client.id, studioId: studio.id, email: client.email })
    if (!token) {
      return NextResponse.json(
        { error: "Authentication system misconfigured" },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set(`client_token_${subdomain}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
    })

    // Send welcome email
    const baseUrl = process.env.NEXTAUTH_URL || 'https://thecurrent.app'
    const bookingUrl = `${baseUrl}/${subdomain}/book`
    
    await sendSystemTemplateEmail({
      studioId: studio.id,
      templateType: "CLIENT_WELCOME",
      to: parsedEmail,
      variables: {
        firstName: parsedFirstName,
        lastName: parsedLastName,
        studioName: studio.name,
        bookingUrl
      }
    }).catch(err => {
      console.error("Failed to send welcome email:", err)
      // Don't fail registration if email fails
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
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}

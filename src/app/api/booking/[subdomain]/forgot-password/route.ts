import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"
import { sendClientPasswordResetEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find studio
    const studio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (!studio) {
      // Don't reveal if studio exists
      return NextResponse.json({ message: "If an account exists, you will receive a reset link." })
    }

    // Find client
    const client = await db.client.findFirst({
      where: { email, studioId: studio.id }
    })

    if (!client) {
      // Don't reveal if client exists
      return NextResponse.json({ message: "If an account exists, you will receive a reset link." })
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token
    await db.client.update({
      where: { id: client.id },
      data: { resetToken, resetTokenExpiry }
    })

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/${subdomain}/reset-password?token=${resetToken}`

    // Send email
    await sendClientPasswordResetEmail(
      studio.id,
      client.email,
      resetUrl,
      client.firstName,
      studio.name
    )

    return NextResponse.json({ message: "If an account exists, you will receive a reset link." })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}



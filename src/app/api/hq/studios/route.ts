import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { randomBytes } from "crypto"
import { sendStudioWelcomeEmail } from "@/lib/email"

export async function GET() {
  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studios = await db.studio.findMany({
    include: {
      owner: true,
      locations: true,
      _count: {
        select: {
          teachers: true,
          clients: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(studios)
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "HQ_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, subdomain, ownerEmail, ownerFirstName, ownerLastName } = body

    const existingStudio = await db.studio.findUnique({
      where: { subdomain }
    })

    if (existingStudio) {
      return NextResponse.json({ error: "Subdomain already taken" }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({
      where: { email: ownerEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Generate setup token (valid for 7 days)
    const setupToken = randomBytes(32).toString("hex")
    const setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create studio with owner (no password yet - they'll set it via email link)
    const studio = await db.studio.create({
      data: {
        name,
        subdomain,
        owner: {
          create: {
            email: ownerEmail,
            password: "", // Empty - will be set via setup link
            firstName: ownerFirstName,
            lastName: ownerLastName,
            role: "OWNER",
            resetToken: setupToken,
            resetTokenExpiry: setupTokenExpiry,
          }
        }
      },
      include: {
        owner: true,
      }
    })

    // Send welcome email with setup link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const setupUrl = `${baseUrl}/setup-account?token=${setupToken}`

    await sendStudioWelcomeEmail({
      ownerEmail,
      ownerName: ownerFirstName,
      studioName: name,
      setupUrl
    })

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to create studio:", error)
    return NextResponse.json({ error: "Failed to create studio" }, { status: 500 })
  }
}

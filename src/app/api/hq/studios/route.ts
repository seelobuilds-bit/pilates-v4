import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

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
    const { name, subdomain, ownerEmail, ownerFirstName, ownerLastName, ownerPassword } = body

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

    const hashedPassword = await bcrypt.hash(ownerPassword, 10)

    const studio = await db.studio.create({
      data: {
        name,
        subdomain,
        owner: {
          create: {
            email: ownerEmail,
            password: hashedPassword,
            firstName: ownerFirstName,
            lastName: ownerLastName,
            role: "OWNER",
          }
        }
      },
      include: {
        owner: true,
      }
    })

    return NextResponse.json(studio)
  } catch (error) {
    console.error("Failed to create studio:", error)
    return NextResponse.json({ error: "Failed to create studio" }, { status: 500 })
  }
}

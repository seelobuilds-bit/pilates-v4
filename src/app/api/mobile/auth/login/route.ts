import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { getMobileTokenTtlSeconds, isMobileAuthConfigured, signMobileToken } from "@/lib/mobile-auth"

function unauthorized() {
  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
}

export async function POST(request: NextRequest) {
  try {
    if (!isMobileAuthConfigured()) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const body = await request.json()
    const email = String(body?.email || "")
      .trim()
      .toLowerCase()
    const password = String(body?.password || "")
    const studioSubdomain = String(body?.studioSubdomain || "")
      .trim()
      .toLowerCase()

    if (!email || !password || !studioSubdomain) {
      return NextResponse.json(
        { error: "email, password, and studioSubdomain are required" },
        { status: 400 }
      )
    }

    const studio = await db.studio.findUnique({
      where: { subdomain: studioSubdomain },
      select: { id: true, name: true, subdomain: true, primaryColor: true, stripeCurrency: true },
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        ownedStudio: true,
        teacher: true,
      },
    })

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      const isOwnerForStudio = user.role === "OWNER" && user.ownedStudio?.id === studio.id
      const isTeacherForStudio = user.role === "TEACHER" && user.teacher?.studioId === studio.id

      if (isOwnerForStudio || isTeacherForStudio) {
        const role = isOwnerForStudio ? "OWNER" : "TEACHER"
        const token = signMobileToken({
          sub: user.id,
          actorType: "USER",
          role,
          studioId: studio.id,
          studioSubdomain: studio.subdomain,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          teacherId: user.teacher?.id || null,
          clientId: null,
        })

        if (!token) {
          return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
        }

        return NextResponse.json({
          token,
          expiresIn: getMobileTokenTtlSeconds(),
          user: {
            id: user.id,
            role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            studio: {
              id: studio.id,
              name: studio.name,
              subdomain: studio.subdomain,
              primaryColor: studio.primaryColor,
              currency: studio.stripeCurrency,
            },
          },
        })
      }
    }

    const client = await db.client.findFirst({
      where: {
        email,
        studioId: studio.id,
      },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        credits: true,
      },
    })

    if (!client?.password) {
      return unauthorized()
    }

    const isClientPasswordValid = await bcrypt.compare(password, client.password)
    if (!isClientPasswordValid) {
      return unauthorized()
    }

    const token = signMobileToken({
      sub: client.id,
      actorType: "CLIENT",
      role: "CLIENT",
      studioId: studio.id,
      studioSubdomain: studio.subdomain,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      teacherId: null,
      clientId: client.id,
    })

    if (!token) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({
      token,
      expiresIn: getMobileTokenTtlSeconds(),
      user: {
        id: client.id,
        role: "CLIENT",
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        credits: client.credits,
        studio: {
          id: studio.id,
          name: studio.name,
          subdomain: studio.subdomain,
          primaryColor: studio.primaryColor,
          currency: studio.stripeCurrency,
        },
      },
    })
  } catch (error) {
    console.error("Mobile login error:", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}

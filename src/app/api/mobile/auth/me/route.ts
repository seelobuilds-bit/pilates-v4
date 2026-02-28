import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
    }

    const decoded = verifyMobileToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const studio = await db.studio.findUnique({
      where: { id: decoded.studioId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        primaryColor: true,
        stripeCurrency: true,
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const studioSummary = {
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      primaryColor: studio.primaryColor,
      currency: studio.stripeCurrency,
    }

    if (decoded.actorType === "USER") {
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
        include: { ownedStudio: true, teacher: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      const isOwner = decoded.role === "OWNER" && user.ownedStudio?.id === studio.id
      const isTeacher = decoded.role === "TEACHER" && user.teacher?.studioId === studio.id

      if (!isOwner && !isTeacher) {
        return NextResponse.json({ error: "Unauthorized for studio" }, { status: 401 })
      }

      return NextResponse.json({
        id: user.id,
        role: decoded.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        teacherId: user.teacher?.id || null,
        studio: studioSummary,
      })
    }

    const client = await db.client.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        studioId: true,
        credits: true,
      },
    })

    if (!client || client.studioId !== studio.id) {
      return NextResponse.json({ error: "Client not found" }, { status: 401 })
    }

    return NextResponse.json({
      id: client.id,
      role: "CLIENT",
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      clientId: client.id,
      credits: client.credits,
      studio: studioSummary,
    })
  } catch (error) {
    console.error("Mobile me error:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

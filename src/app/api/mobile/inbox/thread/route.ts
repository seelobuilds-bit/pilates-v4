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
      },
    })

    if (!studio || studio.subdomain !== decoded.studioSubdomain) {
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const clientIdFromQuery = request.nextUrl.searchParams.get("clientId")

    let resolvedClientId: string | null = null
    if (decoded.role === "CLIENT") {
      resolvedClientId = decoded.clientId || decoded.sub
    } else {
      if (!clientIdFromQuery) {
        return NextResponse.json({ error: "clientId is required" }, { status: 400 })
      }
      resolvedClientId = clientIdFromQuery

      if (decoded.role === "TEACHER") {
        if (!decoded.teacherId) {
          return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
        }

        const hasBooking = await db.booking.findFirst({
          where: {
            studioId: studio.id,
            clientId: resolvedClientId,
            classSession: {
              teacherId: decoded.teacherId,
            },
          },
          select: { id: true },
        })

        if (!hasBooking) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      }
    }

    const client = await db.client.findFirst({
      where: {
        id: resolvedClientId,
        studioId: studio.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const messages = await db.message.findMany({
      where: {
        studioId: studio.id,
        clientId: client.id,
      },
      orderBy: { createdAt: "asc" },
      take: 400,
    })

    return NextResponse.json({
      role: decoded.role,
      studio,
      client,
      messages: messages.map((message) => ({
        id: message.id,
        channel: message.channel,
        direction: message.direction,
        subject: message.subject,
        body: message.body,
        fromName: message.fromName,
        toName: message.toName,
        createdAt: message.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Mobile inbox thread error:", error)
    return NextResponse.json({ error: "Failed to load inbox thread" }, { status: 500 })
  }
}

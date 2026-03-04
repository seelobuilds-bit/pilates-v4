import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveMobileStudioAuthContext } from "@/lib/mobile-auth-context"
import { toMobileStudioSummary } from "@/lib/studio-read-models"

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveMobileStudioAuthContext(request.headers.get("authorization"))
    if (!auth.ok) {
      if (auth.reason === "missing_token") {
        return NextResponse.json({ error: "Missing bearer token" }, { status: 401 })
      }
      if (auth.reason === "invalid_token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
      return NextResponse.json({ error: "Studio not found" }, { status: 401 })
    }

    const decoded = auth.decoded
    const studio = auth.studio
    const studioSummary = toMobileStudioSummary(studio)

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
      studio: studioSummary,
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

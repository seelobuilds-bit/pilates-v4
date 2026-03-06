import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loadInboxConversationSummaries } from "@/lib/inbox-conversations"
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

    if (decoded.role === "CLIENT") {
      const clientId = decoded.clientId || decoded.sub
      const messages = await db.message.findMany({
        where: {
          studioId: studio.id,
          clientId,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      })

      return NextResponse.json({
        role: "CLIENT",
        studio: studioSummary,
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
    }

    let conversations = [] as Awaited<ReturnType<typeof loadInboxConversationSummaries>>

    if (decoded.role === "OWNER") {
      conversations = await loadInboxConversationSummaries({
        studioId: studio.id,
      })
    }

    if (decoded.role === "TEACHER") {
      if (!decoded.teacherId) {
        return NextResponse.json({ error: "Teacher session invalid" }, { status: 401 })
      }

      const bookings = await db.booking.findMany({
        where: {
          studioId: studio.id,
          classSession: {
            teacherId: decoded.teacherId,
          },
        },
        select: {
          clientId: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        distinct: ["clientId"],
        take: 300,
      })

      const clientIds = bookings.map((booking) => booking.clientId)
      conversations = clientIds.length
        ? await loadInboxConversationSummaries({
            studioId: studio.id,
            clientIds,
          })
        : []
    }

    return NextResponse.json({
      role: decoded.role,
      studio: studioSummary,
      conversations,
    })
  } catch (error) {
    console.error("Mobile inbox error:", error)
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 })
  }
}

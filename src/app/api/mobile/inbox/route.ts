import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { extractBearerToken, verifyMobileToken } from "@/lib/mobile-auth"

type ConversationSummary = {
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  messageCount: number
  unreadCount: number
  lastMessage: {
    id: string
    direction: "INBOUND" | "OUTBOUND"
    channel: "EMAIL" | "SMS"
    body: string
    createdAt: string
  } | null
}

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

    let conversations: ConversationSummary[] = []

    if (decoded.role === "OWNER") {
      const messages = await db.message.findMany({
        where: { studioId: studio.id },
        orderBy: { createdAt: "desc" },
        include: {
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
        take: 800,
      })

      const byClient = new Map<string, ConversationSummary>()

      for (const message of messages) {
        if (!message.clientId || !message.client) {
          continue
        }

        const existing = byClient.get(message.clientId)
        if (!existing) {
          byClient.set(message.clientId, {
            clientId: message.clientId,
            clientName: `${message.client.firstName} ${message.client.lastName}`,
            clientEmail: message.client.email,
            clientPhone: message.client.phone,
            messageCount: 1,
            unreadCount: message.direction === "INBOUND" && !message.openedAt ? 1 : 0,
            lastMessage: {
              id: message.id,
              direction: message.direction,
              channel: message.channel,
              body: message.body,
              createdAt: message.createdAt.toISOString(),
            },
          })
          continue
        }

        existing.messageCount += 1
        if (message.direction === "INBOUND" && !message.openedAt) {
          existing.unreadCount += 1
        }
      }

      conversations = Array.from(byClient.values())
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
      const messages = clientIds.length
        ? await db.message.findMany({
            where: {
              studioId: studio.id,
              clientId: { in: clientIds },
            },
            orderBy: { createdAt: "desc" },
            take: 1000,
          })
        : []

      const byClient = new Map<string, ConversationSummary>()

      for (const booking of bookings) {
        byClient.set(booking.clientId, {
          clientId: booking.client.id,
          clientName: `${booking.client.firstName} ${booking.client.lastName}`,
          clientEmail: booking.client.email,
          clientPhone: booking.client.phone,
          messageCount: 0,
          unreadCount: 0,
          lastMessage: null,
        })
      }

      for (const message of messages) {
        if (!message.clientId) continue

        const entry = byClient.get(message.clientId)
        if (!entry) continue

        entry.messageCount += 1
        if (message.direction === "INBOUND" && !message.openedAt) {
          entry.unreadCount += 1
        }

        if (!entry.lastMessage) {
          entry.lastMessage = {
            id: message.id,
            direction: message.direction,
            channel: message.channel,
            body: message.body,
            createdAt: message.createdAt.toISOString(),
          }
        }
      }

      conversations = Array.from(byClient.values())
    }

    conversations.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      }
      if (a.lastMessage) return -1
      if (b.lastMessage) return 1
      return a.clientName.localeCompare(b.clientName)
    })

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

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendHQEmailToStudio } from "@/lib/email"
import { sendEmail } from "@/lib/communications"

// Platform email settings
const PLATFORM_FROM_EMAIL = process.env.PLATFORM_FROM_EMAIL || "hello@notify.thecurrent.app"
const PLATFORM_FROM_NAME = process.env.PLATFORM_FROM_NAME || "Current"
const REPLY_DOMAIN = process.env.REPLY_EMAIL_DOMAIN || "notify.thecurrent.app"

// GET - List all HQ conversations (studios or leads)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "studios" // "studios" or "leads"
    const studioId = searchParams.get("studioId")
    const leadId = searchParams.get("leadId")

    // ========== STUDIO MESSAGES ==========
    if (type === "studios") {
      // If studioId provided, get messages for that studio
      if (studioId) {
        const studio = await db.studio.findUnique({
          where: { id: studioId },
          include: { owner: true }
        })

        if (!studio) {
          return NextResponse.json({ error: "Studio not found" }, { status: 404 })
        }

        const messages = await db.hQMessage.findMany({
          where: { studioId },
          orderBy: { createdAt: "asc" },
          take: 100
        })

        return NextResponse.json({
          studio: {
            id: studio.id,
            name: studio.name,
            ownerName: `${studio.owner.firstName} ${studio.owner.lastName}`,
            ownerEmail: studio.owner.email
          },
          messages: messages.map(msg => ({
            id: msg.id,
            direction: msg.direction,
            subject: msg.subject,
            body: msg.body,
            fromName: msg.fromName,
            createdAt: msg.createdAt.toISOString()
          }))
        })
      }

      // Get all studios with their latest HQ message
      const studios = await db.studio.findMany({
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { name: "asc" }
      })

      // Get latest message and counts for each studio
      const conversations = await Promise.all(
        studios.map(async (studio) => {
          const messages = await db.hQMessage.findMany({
            where: { studioId: studio.id },
            orderBy: { createdAt: "desc" },
            take: 1
          })

          const totalMessages = await db.hQMessage.count({
            where: { studioId: studio.id }
          })

          const unreadCount = await db.hQMessage.count({
            where: {
              studioId: studio.id,
              direction: "INBOUND",
              openedAt: null
            }
          })

          const lastMessage = messages[0]

          return {
            id: studio.id,
            name: studio.name,
            contactName: `${studio.owner.firstName} ${studio.owner.lastName}`,
            contactEmail: studio.owner.email,
            lastMessage: lastMessage ? {
              direction: lastMessage.direction,
              subject: lastMessage.subject,
              body: lastMessage.body.substring(0, 100) + (lastMessage.body.length > 100 ? "..." : ""),
              createdAt: lastMessage.createdAt.toISOString()
            } : null,
            totalMessages,
            unreadCount
          }
        })
      )

      // Sort by last message date (most recent first)
      conversations.sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        }
        if (a.lastMessage) return -1
        if (b.lastMessage) return 1
        return a.name.localeCompare(b.name)
      })

      return NextResponse.json({ conversations })
    }

    // ========== LEAD MESSAGES ==========
    if (type === "leads") {
      // If leadId provided, get messages for that lead
      if (leadId) {
        const lead = await db.lead.findUnique({
          where: { id: leadId }
        })

        if (!lead) {
          return NextResponse.json({ error: "Lead not found" }, { status: 404 })
        }

        const messages = await db.hQMessage.findMany({
          where: { leadId },
          orderBy: { createdAt: "asc" },
          take: 100
        })

        return NextResponse.json({
          lead: {
            id: lead.id,
            studioName: lead.studioName,
            contactName: lead.contactName,
            contactEmail: lead.contactEmail,
            status: lead.status
          },
          messages: messages.map(msg => ({
            id: msg.id,
            direction: msg.direction,
            subject: msg.subject,
            body: msg.body,
            fromName: msg.fromName,
            createdAt: msg.createdAt.toISOString()
          }))
        })
      }

      // Get all leads with messages
      const leads = await db.lead.findMany({
        orderBy: { updatedAt: "desc" }
      })

      // Get latest message and counts for each lead
      const conversations = await Promise.all(
        leads.map(async (lead) => {
          const messages = await db.hQMessage.findMany({
            where: { leadId: lead.id },
            orderBy: { createdAt: "desc" },
            take: 1
          })

          const totalMessages = await db.hQMessage.count({
            where: { leadId: lead.id }
          })

          const unreadCount = await db.hQMessage.count({
            where: {
              leadId: lead.id,
              direction: "INBOUND",
              openedAt: null
            }
          })

          const lastMessage = messages[0]

          // Only include leads that have messages
          if (totalMessages === 0) return null

          return {
            id: lead.id,
            name: lead.studioName,
            contactName: lead.contactName,
            contactEmail: lead.contactEmail,
            status: lead.status,
            lastMessage: lastMessage ? {
              direction: lastMessage.direction,
              subject: lastMessage.subject,
              body: lastMessage.body.substring(0, 100) + (lastMessage.body.length > 100 ? "..." : ""),
              createdAt: lastMessage.createdAt.toISOString()
            } : null,
            totalMessages,
            unreadCount
          }
        })
      )

      // Filter out nulls (leads without messages) and sort by last message
      const filteredConversations = conversations.filter(c => c !== null)
      filteredConversations.sort((a, b) => {
        if (a!.lastMessage && b!.lastMessage) {
          return new Date(b!.lastMessage.createdAt).getTime() - new Date(a!.lastMessage.createdAt).getTime()
        }
        if (a!.lastMessage) return -1
        if (b!.lastMessage) return 1
        return a!.name.localeCompare(b!.name)
      })

      return NextResponse.json({ conversations: filteredConversations })
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
  } catch (error) {
    console.error("Failed to fetch HQ inbox:", error)
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 })
  }
}

// POST - Send message to studio or lead
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { studioId, leadId, subject, message } = body

    if ((!studioId && !leadId) || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ========== SEND TO STUDIO ==========
    if (studioId) {
      const result = await sendHQEmailToStudio({
        studioId,
        subject,
        body: message,
        senderId: session.user.id
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send" }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        messageId: result.dbMessageId 
      })
    }

    // ========== SEND TO LEAD ==========
    if (leadId) {
      const lead = await db.lead.findUnique({ where: { id: leadId } })
      
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 })
      }

      // Generate trackable reply-to
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const threadId = `lead_${leadId}_${msgId}`
      const replyTo = `reply+${threadId}@${REPLY_DOMAIN}`

      // Send the email
      const result = await sendEmail({
        to: lead.contactEmail,
        subject,
        body: message,
        replyTo
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send" }, { status: 500 })
      }

      // Store in HQMessage
      const dbMessage = await db.hQMessage.create({
        data: {
          channel: "EMAIL",
          direction: "OUTBOUND",
          status: "SENT",
          subject,
          body: message,
          htmlBody: `<p>${message.replace(/\n/g, "<br>")}</p>`,
          fromAddress: `${PLATFORM_FROM_NAME} <${PLATFORM_FROM_EMAIL}>`,
          fromName: PLATFORM_FROM_NAME,
          toAddress: lead.contactEmail,
          toName: lead.contactName,
          threadId: `lead_${leadId}`,
          externalId: result.messageId,
          sentAt: new Date(),
          leadId,
          senderId: session.user.id
        }
      })

      // Update lead stats
      await db.lead.update({
        where: { id: leadId },
        data: {
          lastContactedAt: new Date(),
          totalEmails: { increment: 1 }
        }
      })

      // Also log as activity
      await db.leadActivity.create({
        data: {
          leadId,
          type: "EMAIL",
          subject,
          content: message,
          direction: "outbound",
          toAddress: lead.contactEmail,
          outcome: "sent"
        }
      })

      return NextResponse.json({ 
        success: true, 
        messageId: dbMessage.id 
      })
    }

    return NextResponse.json({ error: "No recipient specified" }, { status: 400 })
  } catch (error) {
    console.error("Failed to send HQ message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { headers } from "next/headers"
import { Webhook } from "svix"

/**
 * Resend Inbound Email Webhook
 * 
 * Receives emails sent to reply+{threadId}@notify.thecurrent.app
 * and creates INBOUND messages in the appropriate inbox.
 * 
 * Thread ID format:
 * - Studio to Client: s_{studioId}_c_{clientId}_{messageId}
 * - HQ to Studio: hq_{studioId}_{messageId}
 */

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

interface ResendInboundEmail {
  from: string
  to: string | string[]
  subject: string
  text: string
  html?: string
  headers: Record<string, string>
  attachments?: Array<{
    filename: string
    content: string
    content_type: string
  }>
}

// Extract email address from "Name <email@domain.com>" format
function extractEmail(address: string): string {
  const match = address.match(/<(.+?)>/)
  return match ? match[1] : address
}

// Extract name from "Name <email@domain.com>" format
function extractName(address: string): string | null {
  const match = address.match(/^(.+?)\s*</)
  return match ? match[1].trim() : null
}

// Parse the thread ID from reply address
function parseThreadId(toAddress: string): {
  type: "studio" | "hq" | null
  studioId?: string
  clientId?: string
  messageId?: string
} {
  const email = extractEmail(toAddress).toLowerCase()
  
  // Match reply+{threadId}@notify.thecurrent.app
  const match = email.match(/^reply\+(.+?)@/)
  if (!match) return { type: null }
  
  const threadId = match[1]
  
  // Studio to Client: s_{studioId}_c_{clientId}_{messageId}
  const studioMatch = threadId.match(/^s_([^_]+)_c_([^_]+)_(.+)$/)
  if (studioMatch) {
    return {
      type: "studio",
      studioId: studioMatch[1],
      clientId: studioMatch[2],
      messageId: studioMatch[3]
    }
  }
  
  // HQ to Studio: hq_{studioId}_{messageId}
  const hqMatch = threadId.match(/^hq_([^_]+)_(.+)$/)
  if (hqMatch) {
    return {
      type: "hq",
      studioId: hqMatch[1],
      messageId: hqMatch[2]
    }
  }
  
  return { type: null }
}

// Clean up reply text (remove quoted original message)
function cleanReplyText(text: string): string {
  // Remove common reply patterns
  const lines = text.split('\n')
  const cleanLines: string[] = []
  
  for (const line of lines) {
    // Stop at common reply markers
    if (
      line.startsWith('On ') && line.includes(' wrote:') ||
      line.startsWith('>') ||
      line.match(/^-{3,}/) ||
      line.match(/^_{3,}/) ||
      line.includes('Original Message')
    ) {
      break
    }
    cleanLines.push(line)
  }
  
  return cleanLines.join('\n').trim()
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const headersList = await headers()
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const svixId = headersList.get("svix-id")
      const svixTimestamp = headersList.get("svix-timestamp")
      const svixSignature = headersList.get("svix-signature")
      
      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("[Inbound Email] Missing Svix headers")
        return NextResponse.json({ error: "Missing headers" }, { status: 400 })
      }
      
      try {
        const wh = new Webhook(webhookSecret)
        wh.verify(rawBody, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature
        })
      } catch (err) {
        console.error("[Inbound Email] Invalid signature:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }
    
    const body: ResendInboundEmail = JSON.parse(rawBody)
    
    console.log("[Inbound Email]", {
      from: body.from,
      to: body.to,
      subject: body.subject
    })
    
    // Get the first "to" address
    const toAddress = Array.isArray(body.to) ? body.to[0] : body.to
    
    // Parse the thread ID
    const parsed = parseThreadId(toAddress)
    
    if (!parsed.type) {
      console.log("[Inbound Email] Unknown thread format:", toAddress)
      return NextResponse.json({ message: "Unknown thread format" }, { status: 200 })
    }
    
    const fromEmail = extractEmail(body.from)
    const fromName = extractName(body.from)
    const cleanBody = cleanReplyText(body.text)
    
    if (parsed.type === "studio" && parsed.studioId && parsed.clientId) {
      // This is a client replying to a studio email
      
      // Verify the client exists and belongs to this studio
      const client = await db.client.findFirst({
        where: {
          id: parsed.clientId,
          studioId: parsed.studioId,
          email: fromEmail
        }
      })
      
      if (!client) {
        console.log("[Inbound Email] Client not found or email mismatch")
        return NextResponse.json({ message: "Client not found" }, { status: 200 })
      }
      
      // Create INBOUND message
      await db.message.create({
        data: {
          channel: "EMAIL",
          direction: "INBOUND",
          status: "DELIVERED",
          subject: body.subject,
          body: cleanBody,
          htmlBody: body.html || null,
          fromAddress: fromEmail,
          toAddress: toAddress,
          fromName: fromName || `${client.firstName} ${client.lastName}`,
          threadId: `s_${parsed.studioId}_c_${parsed.clientId}`,
          replyToId: parsed.messageId,
          sentAt: new Date(),
          deliveredAt: new Date(),
          studioId: parsed.studioId,
          clientId: client.id
        }
      })
      
      console.log("[Inbound Email] Created studio message from client:", client.email)
      
    } else if (parsed.type === "hq" && parsed.studioId) {
      // This is a studio owner replying to an HQ email
      
      // Verify the studio exists
      const studio = await db.studio.findUnique({
        where: { id: parsed.studioId },
        include: { owner: true }
      })
      
      if (!studio) {
        console.log("[Inbound Email] Studio not found")
        return NextResponse.json({ message: "Studio not found" }, { status: 200 })
      }
      
      // Verify the sender is the studio owner
      if (studio.owner.email.toLowerCase() !== fromEmail.toLowerCase()) {
        console.log("[Inbound Email] Sender is not studio owner")
        return NextResponse.json({ message: "Unauthorized sender" }, { status: 200 })
      }
      
      // Create INBOUND HQ message
      await db.hQMessage.create({
        data: {
          channel: "EMAIL",
          direction: "INBOUND",
          status: "DELIVERED",
          subject: body.subject,
          body: cleanBody,
          htmlBody: body.html || null,
          fromAddress: fromEmail,
          toAddress: toAddress,
          fromName: fromName || `${studio.owner.firstName} ${studio.owner.lastName}`,
          threadId: `hq_${parsed.studioId}`,
          replyToId: parsed.messageId,
          sentAt: new Date(),
          studioId: parsed.studioId
        }
      })
      
      console.log("[Inbound Email] Created HQ message from studio:", studio.name)
    }
    
    return NextResponse.json({ message: "Email processed" })
    
  } catch (error) {
    console.error("[Inbound Email] Error:", error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}

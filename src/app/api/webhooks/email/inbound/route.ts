import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { headers } from "next/headers"
import { Webhook } from "svix"

// GET - Test endpoint to verify webhook is reachable
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Inbound email webhook is active",
    webhookSecretConfigured: !!process.env.RESEND_WEBHOOK_SECRET
  })
}

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

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string | string[]
    subject?: string
    created_at: string
    // Note: Resend webhooks don't include body - need to fetch via API
  }
}

interface ResendEmailContent {
  text?: string
  html?: string
}

// Fetch actual email content from Resend API using email_id
async function fetchEmailContent(emailId: string): Promise<ResendEmailContent> {
  try {
    // Use Resend's RECEIVING API to get the email content
    // Note: The endpoint is /emails/receiving/:id for inbound emails
    const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      }
    })
    
    if (!response.ok) {
      console.error("[Inbound Email] Failed to fetch email content:", response.status)
      return {}
    }
    
    const data = await response.json()
    console.log("[Inbound Email] Fetched email content:", { 
      hasText: !!data.text, 
      hasHtml: !!data.html,
      textLength: data.text?.length,
      htmlLength: data.html?.length
    })
    
    return {
      text: data.text || "",
      html: data.html || ""
    }
  } catch (error) {
    console.error("[Inbound Email] Error fetching email content:", error)
    return {}
  }
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
  type: "studio" | "hq" | "lead" | null
  studioId?: string
  clientId?: string
  leadId?: string
  messageId?: string
} {
  const email = extractEmail(toAddress).toLowerCase()
  
  // Match reply+{threadId}@notify.thecurrent.app (or custom domain)
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
  
  // HQ to Lead: lead_{leadId}_{messageId}
  const leadMatch = threadId.match(/^lead_([^_]+)_(.+)$/)
  if (leadMatch) {
    return {
      type: "lead",
      leadId: leadMatch[1],
      messageId: leadMatch[2]
    }
  }
  
  return { type: null }
}

// Clean up reply text (remove quoted original message)
function cleanReplyText(text: string): string {
  if (!text) return ""
  
  // Remove common reply patterns
  const lines = text.split('\n')
  const cleanLines: string[] = []
  let foundQuoteMarker = false
  
  for (const line of lines) {
    // Stop at common reply markers (but only if we have some content already)
    if (cleanLines.length > 0) {
      if (
        (line.startsWith('On ') && line.includes(' wrote:')) ||
        line.match(/^-{3,}\s*Original Message\s*-{3,}/i) ||
        line.match(/^_{3,}/) ||
        line.includes('Original Message') ||
        line.match(/^From:.*@/)
      ) {
        foundQuoteMarker = true
        break
      }
    }
    
    // Skip lines that start with > (quoted text) but don't break
    if (line.startsWith('>')) {
      continue
    }
    
    cleanLines.push(line)
  }
  
  const result = cleanLines.join('\n').trim()
  
  // If we got nothing useful, return the original (trimmed)
  if (!result && text) {
    return text.substring(0, 5000).trim() // Limit length but keep content
  }
  
  return result
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const headersList = await headers()
    
    console.log("[Inbound Email] Webhook received")
    console.log("[Inbound Email] Raw body preview:", rawBody.substring(0, 500))
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const svixId = headersList.get("svix-id")
      const svixTimestamp = headersList.get("svix-timestamp")
      const svixSignature = headersList.get("svix-signature")
      
      console.log("[Inbound Email] Svix headers present:", { svixId: !!svixId, svixTimestamp: !!svixTimestamp, svixSignature: !!svixSignature })
      
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
        console.log("[Inbound Email] Signature verified successfully")
      } catch (err) {
        console.error("[Inbound Email] Invalid signature:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } else {
      console.log("[Inbound Email] No webhook secret configured, skipping verification")
    }
    
    const payload: ResendWebhookPayload = JSON.parse(rawBody)
    
    console.log("[Inbound Email] Event type:", payload.type)
    console.log("[Inbound Email] Full payload keys:", Object.keys(payload))
    console.log("[Inbound Email] Data keys:", payload.data ? Object.keys(payload.data) : "no data")
    
    const emailData = payload.data
    
    if (!emailData) {
      console.error("[Inbound Email] No data in payload")
      return NextResponse.json({ error: "No email data" }, { status: 400 })
    }
    
    console.log("[Inbound Email] Parsed email:", {
      email_id: emailData.email_id,
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject
    })
    
    // Validate we have required fields
    if (!emailData.from || !emailData.to) {
      console.error("[Inbound Email] Missing required fields - from:", emailData.from, "to:", emailData.to)
      return NextResponse.json({ error: "Missing required email fields" }, { status: 400 })
    }
    
    // Fetch the actual email content from Resend API
    let emailContent: ResendEmailContent = {}
    if (emailData.email_id) {
      emailContent = await fetchEmailContent(emailData.email_id)
    }
    
    // Build a combined body object for processing
    const body = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject || "",
      text: emailContent.text || "",
      html: emailContent.html || ""
    }
    
    console.log("[Inbound Email] Email content:", {
      subject: body.subject,
      textLength: body.text?.length || 0,
      textPreview: body.text?.substring(0, 200)
    })
    
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
      console.log("[Inbound Email] Unknown thread format, trying to match by sender:", toAddress)
      
      // Try to find existing conversation by sender email
      const fromEmail = extractEmail(body.from).toLowerCase()
      const fromName = extractName(body.from)
      const cleanBody = cleanReplyText(body.text || body.html || "")
      
      // Check if sender is a lead
      const lead = await db.lead.findFirst({
        where: { contactEmail: { equals: fromEmail, mode: "insensitive" } }
      })
      
      if (lead) {
        // Create message for this lead
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
            fromName: fromName || lead.contactName,
            threadId: `lead_${lead.id}`,
            sentAt: new Date(),
            leadId: lead.id
          }
        })
        
        await db.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "EMAIL",
            subject: body.subject,
            content: cleanBody,
            direction: "inbound",
            fromAddress: fromEmail
          }
        })
        
        await db.lead.update({
          where: { id: lead.id },
          data: { lastContactedAt: new Date() }
        })
        
        console.log("[Inbound Email] Matched to lead by sender email:", lead.studioName)
        return NextResponse.json({ message: "Email matched to lead" })
      }
      
      // Check if sender is a studio owner
      const studioOwner = await db.user.findFirst({
        where: { 
          email: { equals: fromEmail, mode: "insensitive" },
          role: "OWNER"
        },
        include: { ownedStudios: true }
      })
      
      if (studioOwner && studioOwner.ownedStudios.length > 0) {
        const studio = studioOwner.ownedStudios[0]
        
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
            fromName: fromName || `${studioOwner.firstName} ${studioOwner.lastName}`,
            threadId: `hq_${studio.id}`,
            sentAt: new Date(),
            studioId: studio.id
          }
        })
        
        console.log("[Inbound Email] Matched to studio owner by sender email:", studio.name)
        return NextResponse.json({ message: "Email matched to studio" })
      }
      
      console.log("[Inbound Email] Could not match sender to any lead or studio:", fromEmail)
      return NextResponse.json({ message: "Unknown sender" }, { status: 200 })
    }
    
    const fromEmail = extractEmail(body.from)
    const fromName = extractName(body.from)
    const cleanBody = cleanReplyText(body.text || body.html || "")
    
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
      
    } else if (parsed.type === "lead" && parsed.leadId) {
      // This is a lead (potential studio) replying to an HQ email
      
      // Verify the lead exists
      const lead = await db.lead.findUnique({
        where: { id: parsed.leadId }
      })
      
      if (!lead) {
        console.log("[Inbound Email] Lead not found")
        return NextResponse.json({ message: "Lead not found" }, { status: 200 })
      }
      
      // Verify the sender is the lead contact
      if (lead.contactEmail.toLowerCase() !== fromEmail.toLowerCase()) {
        console.log("[Inbound Email] Sender is not lead contact")
        return NextResponse.json({ message: "Unauthorized sender" }, { status: 200 })
      }
      
      // Create INBOUND HQ message for lead
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
          fromName: fromName || lead.contactName,
          threadId: `lead_${parsed.leadId}`,
          replyToId: parsed.messageId,
          sentAt: new Date(),
          leadId: parsed.leadId
        }
      })
      
      // Also log as activity
      await db.leadActivity.create({
        data: {
          leadId: parsed.leadId,
          type: "EMAIL",
          subject: body.subject,
          content: cleanBody,
          direction: "inbound",
          fromAddress: fromEmail
        }
      })
      
      // Update lead last contacted
      await db.lead.update({
        where: { id: parsed.leadId },
        data: { lastContactedAt: new Date() }
      })
      
      console.log("[Inbound Email] Created HQ message from lead:", lead.studioName)
    }
    
    return NextResponse.json({ message: "Email processed" })
    
  } catch (error) {
    console.error("[Inbound Email] Error:", error)
    console.error("[Inbound Email] Error stack:", error instanceof Error ? error.stack : "no stack")
    return NextResponse.json({ 
      error: "Processing failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

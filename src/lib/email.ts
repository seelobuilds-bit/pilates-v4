import { Resend } from "resend"
import { db } from "@/lib/db"

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Platform email config (for emails TO studio owners/teachers)
const PLATFORM_FROM_EMAIL = process.env.PLATFORM_FROM_EMAIL || "hello@notify.thecurrent.app"
const PLATFORM_FROM_NAME = process.env.PLATFORM_FROM_NAME || "Current"
const PLATFORM_REPLY_TO = process.env.PLATFORM_REPLY_TO || "support@notify.thecurrent.app"

// Fallback domain for studios without verified domain
const FALLBACK_DOMAIN = process.env.FALLBACK_EMAIL_DOMAIN || "notify.thecurrent.app"

// Reply domain for inbound processing (fallback for unverified studios)
const REPLY_DOMAIN = process.env.REPLY_EMAIL_DOMAIN || "notify.thecurrent.app"

/**
 * Generate a trackable reply-to address
 * Uses studio's verified domain if available, otherwise falls back to platform domain
 */
function generateReplyAddress(threadId: string, customDomain?: string): string {
  const domain = customDomain || REPLY_DOMAIN
  return `reply+${threadId}@${domain}`
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  // For studio emails - pass studioId to use their config
  studioId?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Get the from address for a studio
 * Uses verified domain if available, otherwise fallback
 */
export async function getStudioFromAddress(studioId: string): Promise<{
  from: string
  replyDomain?: string  // Domain to use for trackable reply-to
  staticReplyTo?: string  // Static reply-to (fallback if no inbound configured)
}> {
  const studio = await db.studio.findUnique({
    where: { id: studioId },
    include: { emailConfig: true }
  })

  if (!studio) {
    return { from: `${PLATFORM_FROM_NAME} <${PLATFORM_FROM_EMAIL}>` }
  }

  const config = studio.emailConfig

  // If no config or domain not verified, use fallback
  if (!config || config.domainStatus !== "verified") {
    // Fallback: zenith@notify.thecurrent.app
    const fallbackEmail = `${studio.subdomain}@${FALLBACK_DOMAIN}`
    return {
      from: `${config?.fromName || studio.name} <${fallbackEmail}>`,
      replyDomain: FALLBACK_DOMAIN,  // Replies go through our domain
      staticReplyTo: config?.replyToEmail || undefined
    }
  }

  // Use verified domain - replies also go through their domain
  const fromEmail = config.fromEmail 
    ? `${config.fromEmail}@${config.domain}` 
    : `hello@${config.domain}`
    
  return {
    from: `${config.fromName} <${fromEmail}>`,
    replyDomain: config.domain!,  // Replies go through their domain
    staticReplyTo: config.replyToEmail || undefined
  }
}

/**
 * Send an email
 * - If studioId provided: sends from studio's email (white-labeled)
 * - If no studioId: sends from platform email
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, replyTo, studioId } = params

  // If Resend not configured, simulate
  if (!resend) {
    console.log("[EMAIL SIMULATION]", { to, subject, studioId })
    return { success: true, messageId: `sim_${Date.now()}` }
  }

  try {
    let fromAddress: string
    let finalReplyTo: string | undefined

    if (studioId) {
      // Studio email - use their config
      const studioFrom = await getStudioFromAddress(studioId)
      fromAddress = studioFrom.from
      finalReplyTo = replyTo || studioFrom.staticReplyTo
    } else {
      // Platform email
      fromAddress = `${PLATFORM_FROM_NAME} <${PLATFORM_FROM_EMAIL}>`
      finalReplyTo = replyTo || PLATFORM_REPLY_TO
    }

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      reply_to: finalReplyTo
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Email send error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send platform email (to owners, teachers, HQ)
 * Always comes from Current
 */
export async function sendPlatformEmail(params: Omit<SendEmailParams, "studioId">): Promise<SendEmailResult> {
  return sendEmail(params)
}

/**
 * Send studio email (to clients)
 * Uses studio's white-labeled email config
 */
export async function sendStudioEmail(
  studioId: string,
  params: Omit<SendEmailParams, "studioId">
): Promise<SendEmailResult> {
  return sendEmail({ ...params, studioId })
}

/**
 * Send studio email to client AND store in inbox
 * This enables two-way communication with trackable replies
 */
export async function sendStudioEmailToClient(params: {
  studioId: string
  clientId: string
  clientEmail: string
  clientName?: string
  subject: string
  body: string
  htmlBody?: string
}): Promise<SendEmailResult & { messageId?: string; dbMessageId?: string }> {
  const { studioId, clientId, clientEmail, clientName, subject, body, htmlBody } = params

  // Generate unique message ID for thread tracking
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const threadId = `s_${studioId}_c_${clientId}_${messageId}`
  
  // Get studio config for from address
  const studioFrom = await getStudioFromAddress(studioId)
  
  // Create trackable reply-to address using studio's domain if verified
  const replyTo = generateReplyAddress(threadId, studioFrom.replyDomain)

  // Send the email
  const result = await sendEmail({
    studioId,
    to: clientEmail,
    subject,
    html: htmlBody || `<p>${body.replace(/\n/g, "<br>")}</p>`,
    text: body,
    replyTo
  })

  if (!result.success) {
    return result
  }

  // Store in database
  try {
    const dbMessage = await db.message.create({
      data: {
        channel: "EMAIL",
        direction: "OUTBOUND",
        status: "SENT",
        subject,
        body,
        htmlBody: htmlBody || null,
        fromAddress: studioFrom.from,
        toAddress: clientEmail,
        toName: clientName || null,
        threadId: `s_${studioId}_c_${clientId}`,
        externalId: result.messageId,
        sentAt: new Date(),
        studioId,
        clientId
      }
    })

    return { ...result, dbMessageId: dbMessage.id }
  } catch (error) {
    console.error("Failed to store message in database:", error)
    return result
  }
}

/**
 * Send HQ email to studio owner AND store in inbox
 * This enables two-way communication between HQ and studios
 */
export async function sendHQEmailToStudio(params: {
  studioId: string
  subject: string
  body: string
  htmlBody?: string
  senderId?: string // HQ admin user ID
}): Promise<SendEmailResult & { dbMessageId?: string }> {
  const { studioId, subject, body, htmlBody, senderId } = params

  // Get studio with owner info
  const studio = await db.studio.findUnique({
    where: { id: studioId },
    include: { owner: true }
  })

  if (!studio) {
    return { success: false, error: "Studio not found" }
  }

  // Generate unique message ID for thread tracking
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const threadId = `hq_${studioId}_${messageId}`
  
  // Create trackable reply-to address
  const replyTo = generateReplyAddress(threadId)

  // Send the email from platform
  const result = await sendPlatformEmail({
    to: studio.owner.email,
    subject,
    html: htmlBody || `<p>${body.replace(/\n/g, "<br>")}</p>`,
    text: body,
    replyTo
  })

  if (!result.success) {
    return result
  }

  // Store in HQ messages
  try {
    const dbMessage = await db.hQMessage.create({
      data: {
        channel: "EMAIL",
        direction: "OUTBOUND",
        status: "SENT",
        subject,
        body,
        htmlBody: htmlBody || null,
        fromAddress: PLATFORM_FROM_EMAIL,
        fromName: PLATFORM_FROM_NAME,
        toAddress: studio.owner.email,
        toName: `${studio.owner.firstName} ${studio.owner.lastName}`,
        threadId: `hq_${studioId}`,
        externalId: result.messageId,
        sentAt: new Date(),
        studioId,
        senderId
      }
    })

    return { ...result, dbMessageId: dbMessage.id }
  } catch (error) {
    console.error("Failed to store HQ message in database:", error)
    return result
  }
}

// ======================
// Domain Verification
// ======================

export interface DomainRecord {
  type: string
  name: string
  value: string
  priority?: number
  status: "pending" | "verified" | "failed"
}

export interface DomainVerificationResult {
  success: boolean
  domainId?: string
  status?: string
  records?: DomainRecord[]
  error?: string
}

/**
 * Create a domain in Resend for verification
 */
export async function createDomain(domain: string): Promise<DomainVerificationResult> {
  if (!resend) {
    // Simulation mode
    return {
      success: true,
      domainId: `sim_domain_${Date.now()}`,
      status: "pending",
      records: [
        { type: "TXT", name: `_resend.${domain}`, value: "simulated-verification-key", status: "pending" },
        { type: "TXT", name: `resend._domainkey.${domain}`, value: "simulated-dkim-key", status: "pending" },
      ]
    }
  }

  try {
    const { data, error } = await resend.domains.create({ name: domain })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get the DNS records
    const records: DomainRecord[] = data?.records?.map((r: { type: string; name: string; value: string; priority?: number; status: string }) => ({
      type: r.type,
      name: r.name,
      value: r.value,
      priority: r.priority,
      status: r.status as "pending" | "verified" | "failed"
    })) || []

    return {
      success: true,
      domainId: data?.id,
      status: data?.status,
      records
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

/**
 * Check domain verification status
 */
export async function checkDomainStatus(domainId: string): Promise<DomainVerificationResult> {
  if (!resend) {
    return {
      success: true,
      domainId,
      status: "verified",
      records: []
    }
  }

  try {
    const { data, error } = await resend.domains.get(domainId)

    if (error) {
      return { success: false, error: error.message }
    }

    const records: DomainRecord[] = data?.records?.map((r: { type: string; name: string; value: string; priority?: number; status: string }) => ({
      type: r.type,
      name: r.name,
      value: r.value,
      priority: r.priority,
      status: r.status as "pending" | "verified" | "failed"
    })) || []

    return {
      success: true,
      domainId: data?.id,
      status: data?.status,
      records
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

/**
 * Verify a domain (trigger verification check)
 */
export async function verifyDomain(domainId: string): Promise<DomainVerificationResult> {
  if (!resend) {
    return {
      success: true,
      domainId,
      status: "verified",
      records: []
    }
  }

  try {
    const { data, error } = await resend.domains.verify(domainId)

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      domainId: data?.id,
      status: data?.status
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

/**
 * Delete a domain from Resend
 */
export async function deleteDomain(domainId: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: true }
  }

  try {
    const { error } = await resend.domains.remove(domainId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: errorMessage }
  }
}

// ======================
// Email Templates
// ======================

interface TemplateVariables {
  [key: string]: string | number | undefined
}

/**
 * Replace template variables in a string
 */
export function replaceVariables(template: string, variables: TemplateVariables): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value ?? ""))
  }
  return result
}

/**
 * Send a password reset email (for studio clients)
 */
export async function sendClientPasswordResetEmail(
  studioId: string,
  clientEmail: string,
  resetUrl: string,
  clientName: string,
  studioName: string
): Promise<SendEmailResult> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 16px;">We received a request to reset your password for your account at ${studioName}.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
    <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px;">Can't click the button? Copy and paste this link into your browser:</p>
    <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>
`

  return sendStudioEmail(studioId, {
    to: clientEmail,
    subject: `Reset your password - ${studioName}`,
    html
  })
}

/**
 * Send a password reset email (for platform users - owners/teachers)
 */
export async function sendPlatformPasswordResetEmail(
  userEmail: string,
  resetUrl: string,
  userName: string
): Promise<SendEmailResult> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${userName},</p>
    <p style="color: #374151; font-size: 16px;">We received a request to reset your Current platform password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
    <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px;">Can't click the button? Copy and paste this link into your browser:</p>
    <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>
`

  return sendPlatformEmail({
    to: userEmail,
    subject: "Reset your password - Current",
    html
  })
}

/**
 * Send a welcome email to new client
 */
export async function sendClientWelcomeEmail(
  studioId: string,
  clientEmail: string,
  clientName: string,
  studioName: string,
  bookingUrl: string
): Promise<SendEmailResult> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${studioName}! 🎉</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 16px;">Thanks for creating an account with us! We're excited to have you.</p>
    <p style="color: #374151; font-size: 16px;">You can now:</p>
    <ul style="color: #374151; font-size: 16px;">
      <li>Book classes easily</li>
      <li>Manage your memberships</li>
      <li>View your class history</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${bookingUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Book Your First Class</a>
    </div>
    <p style="color: #374151; font-size: 16px;">See you in the studio!</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">${studioName}</p>
  </div>
</body>
</html>
`

  return sendStudioEmail(studioId, {
    to: clientEmail,
    subject: `Welcome to ${studioName}!`,
    html
  })
}

/**
 * Send welcome email to new studio owner (from HQ)
 * Includes link to set up their account/password
 */
export async function sendStudioWelcomeEmail(params: {
  ownerEmail: string
  ownerName: string
  studioName: string
  setupUrl: string
}): Promise<SendEmailResult> {
  const { ownerEmail, ownerName, studioName, setupUrl } = params

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Current! 🎉</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${ownerName},</p>
    <p style="color: #374151; font-size: 16px;">Great news! Your studio <strong>${studioName}</strong> has been set up on Current.</p>
    <p style="color: #374151; font-size: 16px;">To get started, click the button below to set up your password and access your dashboard:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${setupUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Set Up My Account</a>
    </div>
    <p style="color: #374151; font-size: 16px;">Once you're in, you can:</p>
    <ul style="color: #374151; font-size: 16px;">
      <li>Set up your class schedule</li>
      <li>Add your teachers</li>
      <li>Configure your booking page</li>
      <li>Start accepting clients!</li>
    </ul>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 7 days. If you need a new link, please contact support.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px;">Can't click the button? Copy and paste this link into your browser:</p>
    <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">${setupUrl}</p>
  </div>
</body>
</html>
`

  return sendPlatformEmail({
    to: ownerEmail,
    subject: `Welcome to Current - Set up your ${studioName} account`,
    html
  })
}

// ======================
// Booking & Class Emails
// ======================

interface BookingDetails {
  bookingId: string
  className: string
  teacherName: string
  locationName: string
  locationAddress?: string
  startTime: Date
  endTime: Date
  amount?: number
  status: string
}

/**
 * Send booking confirmation email to client
 */
export async function sendBookingConfirmationEmail(params: {
  studioId: string
  studioName: string
  clientEmail: string
  clientName: string
  booking: BookingDetails
  manageBookingUrl: string
}): Promise<SendEmailResult> {
  const { studioId, studioName, clientEmail, clientName, booking, manageBookingUrl } = params

  const dateStr = booking.startTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = booking.startTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })
  const endTimeStr = booking.endTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! ✓</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 16px;">Your class has been booked at <strong>${studioName}</strong>!</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <h2 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 20px;">${booking.className}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 Date</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">⏰ Time</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${timeStr} - ${endTimeStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">👤 Teacher</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${booking.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 Location</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${booking.locationName}</td>
        </tr>
        ${booking.locationAddress ? `<tr>
          <td style="padding: 8px 0;"></td>
          <td style="padding: 0 0 8px 0; color: #6b7280; font-size: 12px;">${booking.locationAddress}</td>
        </tr>` : ''}
        ${booking.amount ? `<tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">💳 Amount</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">$${booking.amount.toFixed(2)}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${manageBookingUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View or Manage Booking</a>
    </div>

    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin-top: 20px;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before class. Late cancellations (12-24 hours) incur a 50% fee. No refunds within 12 hours of class time.
      </p>
    </div>

    <p style="color: #374151; font-size: 16px; margin-top: 30px;">See you in class! 🧘</p>
    <p style="color: #374151; font-size: 16px;">${studioName}</p>
  </div>
</body>
</html>
`

  return sendStudioEmail(studioId, {
    to: clientEmail,
    subject: `Booking Confirmed: ${booking.className} - ${dateStr}`,
    html
  })
}

/**
 * Send class reminder email (typically 24hr or 1hr before)
 */
export async function sendClassReminderEmail(params: {
  studioId: string
  studioName: string
  clientEmail: string
  clientName: string
  booking: BookingDetails
  reminderType: '24hr' | '1hr'
  manageBookingUrl: string
}): Promise<SendEmailResult> {
  const { studioId, studioName, clientEmail, clientName, booking, reminderType, manageBookingUrl } = params

  const dateStr = booking.startTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = booking.startTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })

  const reminderText = reminderType === '24hr' 
    ? "Your class is coming up tomorrow!"
    : "Your class starts in 1 hour!"

  const emoji = reminderType === '24hr' ? '📅' : '⏰'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${emoji} Class Reminder</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 18px; font-weight: 600;">${reminderText}</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <h2 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 20px;">${booking.className}</h2>
      <p style="color: #374151; font-size: 16px; margin: 5px 0;"><strong>${dateStr}</strong></p>
      <p style="color: #374151; font-size: 16px; margin: 5px 0;">${timeStr} with ${booking.teacherName}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">📍 ${booking.locationName}</p>
    </div>

    <div style="background: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #065f46; font-size: 14px; margin: 0;">
        <strong>What to bring:</strong> Water bottle, towel, comfortable clothing. Please arrive 5-10 minutes early.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${manageBookingUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Booking Details</a>
    </div>

    ${reminderType === '24hr' ? `
    <p style="color: #6b7280; font-size: 14px;">
      Need to cancel? You can still cancel for free until ${new Date(booking.startTime.getTime() - 24*60*60*1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} today.
    </p>
    ` : ''}

    <p style="color: #374151; font-size: 16px; margin-top: 30px;">See you soon! 🧘</p>
    <p style="color: #374151; font-size: 16px;">${studioName}</p>
  </div>
</body>
</html>
`

  const subjectPrefix = reminderType === '24hr' ? 'Tomorrow' : 'Starting Soon'

  return sendStudioEmail(studioId, {
    to: clientEmail,
    subject: `${subjectPrefix}: ${booking.className} at ${timeStr}`,
    html
  })
}

/**
 * Send waitlist notification email when a spot opens up
 */
export async function sendWaitlistNotificationEmail(params: {
  studioId: string
  studioName: string
  clientEmail: string
  clientName: string
  className: string
  teacherName: string
  locationName: string
  startTime: Date
  position: number
  claimUrl: string
  expiresAt: Date
}): Promise<SendEmailResult> {
  const { studioId, studioName, clientEmail, clientName, className, teacherName, locationName, startTime, position, claimUrl, expiresAt } = params

  const dateStr = startTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = startTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })
  const expiresStr = expiresAt.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 A Spot Opened Up!</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 18px; font-weight: 600;">Great news! A spot just opened up in the class you were waiting for!</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">${className}</h2>
      <p style="color: #374151; font-size: 16px; margin: 5px 0;"><strong>${dateStr}</strong></p>
      <p style="color: #374151; font-size: 16px; margin: 5px 0;">${timeStr} with ${teacherName}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">📍 ${locationName}</p>
    </div>

    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>⏰ Act Fast!</strong> You were #${position} on the waitlist. Claim your spot before <strong>${expiresStr}</strong> or it will go to the next person.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${claimUrl}" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 18px;">Claim My Spot</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">If you no longer want this spot, no action is needed - it will automatically be offered to the next person on the waitlist.</p>

    <p style="color: #374151; font-size: 16px; margin-top: 30px;">Hope to see you there! 🧘</p>
    <p style="color: #374151; font-size: 16px;">${studioName}</p>
  </div>
</body>
</html>
`

  return sendStudioEmail(studioId, {
    to: clientEmail,
    subject: `🎉 Spot Available! ${className} - ${dateStr}`,
    html
  })
}

/**
 * Send booking cancellation confirmation email
 */
export async function sendBookingCancellationEmail(params: {
  studioId: string
  studioName: string
  clientEmail: string
  clientName: string
  booking: BookingDetails
  refundAmount?: number
  cancellationType: 'FREE' | 'LATE' | 'NO_REFUND'
}): Promise<SendEmailResult> {
  const { studioId, studioName, clientEmail, clientName, booking, refundAmount, cancellationType } = params

  const dateStr = booking.startTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })
  const timeStr = booking.startTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  })

  let refundMessage = ''
  if (cancellationType === 'FREE' && refundAmount && refundAmount > 0) {
    refundMessage = `<p style="color: #059669; font-size: 16px; font-weight: 600;">A full refund of $${refundAmount.toFixed(2)} will be processed within 5-10 business days.</p>`
  } else if (cancellationType === 'LATE' && refundAmount && refundAmount > 0) {
    refundMessage = `<p style="color: #d97706; font-size: 16px;">Due to late cancellation (within 24 hours), a 50% fee applies. You will be refunded $${refundAmount.toFixed(2)}.</p>`
  } else if (cancellationType === 'NO_REFUND') {
    refundMessage = `<p style="color: #dc2626; font-size: 16px;">Due to cancellation within 12 hours of class time, no refund is available per our cancellation policy.</p>`
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f3f4f6; padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #374151; margin: 0; font-size: 24px;">Booking Cancelled</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 16px;">Your booking has been cancelled:</p>
    
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #9ca3af; opacity: 0.8;">
      <h2 style="color: #6b7280; margin: 0 0 15px 0; font-size: 20px; text-decoration: line-through;">${booking.className}</h2>
      <p style="color: #6b7280; font-size: 16px; margin: 5px 0;">${dateStr}</p>
      <p style="color: #6b7280; font-size: 16px; margin: 5px 0;">${timeStr} with ${booking.teacherName}</p>
      <p style="color: #9ca3af; font-size: 14px; margin: 5px 0;">📍 ${booking.locationName}</p>
    </div>

    ${refundMessage}

    <p style="color: #374151; font-size: 16px; margin-top: 20px;">We hope to see you in another class soon!</p>
    <p style="color: #374151; font-size: 16px;">${studioName}</p>
  </div>
</body>
</html>
`

  return sendStudioEmail(studioId, {
    to: clientEmail,
    subject: `Booking Cancelled: ${booking.className} - ${dateStr}`,
    html
  })
}

/**
 * Send a system email using a template
 * Fetches the template from the database, substitutes variables, and sends
 */
export async function sendSystemTemplateEmail(params: {
  studioId: string
  templateType: string
  to: string
  variables: Record<string, string>
}): Promise<SendEmailResult> {
  const { studioId, templateType, to, variables } = params

  try {
    // Fetch the template for this studio
    const template = await db.systemEmailTemplate.findFirst({
      where: {
        studioId,
        type: templateType as any,
        isEnabled: true
      }
    })

    if (!template) {
      console.log(`[EMAIL] Template ${templateType} not found or disabled for studio ${studioId}`)
      return { success: false, error: "Template not found or disabled" }
    }

    // Substitute variables in subject and body
    let subject = template.subject
    let htmlBody = template.htmlBody
    let textBody = template.body

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      subject = subject.replace(placeholder, value)
      htmlBody = htmlBody.replace(placeholder, value)
      textBody = textBody.replace(placeholder, value)
    }

    // Send the email
    return sendStudioEmail(studioId, {
      to,
      subject,
      html: htmlBody,
      text: textBody
    })
  } catch (error) {
    console.error(`[EMAIL] Failed to send template ${templateType}:`, error)
    return { success: false, error: "Failed to send email" }
  }
}

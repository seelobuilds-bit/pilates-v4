import { Resend } from "resend"
import { db } from "@/lib/db"

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Platform email config (for emails TO studio owners/teachers)
const PLATFORM_FROM_EMAIL = process.env.PLATFORM_FROM_EMAIL || "noreply@notify.thecurrent.app"
const PLATFORM_FROM_NAME = process.env.PLATFORM_FROM_NAME || "Current"
const PLATFORM_REPLY_TO = process.env.PLATFORM_REPLY_TO || "support@thecurrent.app"

// Fallback domain for studios without verified domain
const FALLBACK_DOMAIN = process.env.FALLBACK_EMAIL_DOMAIN || "notify.thecurrent.app"

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
async function getStudioFromAddress(studioId: string): Promise<{
  from: string
  replyTo?: string
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
      replyTo: config?.replyToEmail || undefined
    }
  }

  // Use verified domain
  const fromEmail = config.fromEmail 
    ? `${config.fromEmail}@${config.domain}` 
    : `hello@${config.domain}`
    
  return {
    from: `${config.fromName} <${fromEmail}>`,
    replyTo: config.replyToEmail || undefined
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
      finalReplyTo = replyTo || studioFrom.replyTo
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


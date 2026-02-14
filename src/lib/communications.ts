import twilio from "twilio"
import { Resend } from "resend"
import { db } from "@/lib/db"

/**
 * Communications Service
 * 
 * Configure multiple Twilio numbers in .env:
 * - TWILIO_PHONE_NUMBER (default)
 * - NEXT_PUBLIC_TWILIO_UK_NUMBER (UK number)
 * - NEXT_PUBLIC_TWILIO_IE_NUMBER (Ireland number)
 * - NEXT_PUBLIC_TWILIO_US_NUMBER (US number)
 */

// Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// Resend client for emails
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Fallback email domain for studios without verified domain
const FALLBACK_DOMAIN = process.env.FALLBACK_EMAIL_DOMAIN || "notify.thecurrent.app"

export interface SendSMSParams {
  to: string
  toName?: string
  body: string
  from?: string
  clientId?: string
}

export interface SendEmailParams {
  to: string
  toName?: string
  subject: string
  body: string
  htmlBody?: string
  from?: string
  replyTo?: string
  clientId?: string
}

export interface MakeCallParams {
  to: string
  from?: string
  recordCall?: boolean
  callbackUrl?: string
}

// Check if services are configured
export function getServiceStatus() {
  return {
    sms: !!twilioClient,
    voice: !!twilioClient,
    email: !!resend,
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    emailConfigured: !!process.env.RESEND_API_KEY,
  }
}

// Send SMS - supports both HQ/sales (no studioId) and studio-to-client (with studioId)
export async function sendSMS(
  studioIdOrParams: string | (SendSMSParams & { message?: string }),
  params?: SendSMSParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Handle both calling patterns
  let studioId: string | undefined
  let smsParams: SendSMSParams & { message?: string }
  
  if (typeof studioIdOrParams === "string") {
    studioId = studioIdOrParams
    smsParams = params!
  } else {
    smsParams = studioIdOrParams
  }

  // Support legacy 'message' field
  const messageBody = smsParams.body || smsParams.message || ""

  if (!twilioClient) {
    // Log instead of actually sending when not configured
    console.log("[SMS SIMULATION]", { studioId, ...smsParams })
    return { success: true, messageId: "simulated-" + Date.now() }
  }

  try {
    const message = await twilioClient.messages.create({
      to: smsParams.to,
      from: smsParams.from || process.env.TWILIO_PHONE_NUMBER,
      body: messageBody,
    })

    // Store message in database if studio context
    if (studioId && smsParams.clientId) {
      await db.message.create({
        data: {
          channel: "SMS",
          direction: "OUTBOUND",
          status: "SENT",
          body: messageBody,
          fromAddress: smsParams.from || process.env.TWILIO_PHONE_NUMBER || "unknown",
          toAddress: smsParams.to,
          toName: smsParams.toName || null,
          externalId: message.sid,
          sentAt: new Date(),
          studioId,
          clientId: smsParams.clientId
        }
      })
    }

    return { success: true, messageId: message.sid }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("SMS Error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Platform email settings (for HQ/sales communications)
const PLATFORM_FROM_EMAIL = process.env.PLATFORM_FROM_EMAIL || "hello@notify.thecurrent.app"
const PLATFORM_FROM_NAME = process.env.PLATFORM_FROM_NAME || "Current"

// Send Email - supports both HQ/sales (no studioId) and studio-to-client (with studioId)
export async function sendEmail(
  studioIdOrParams: string | SendEmailParams,
  params?: SendEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Handle both calling patterns
  let studioId: string | undefined
  let emailParams: SendEmailParams
  
  if (typeof studioIdOrParams === "string") {
    studioId = studioIdOrParams
    emailParams = params!
  } else {
    emailParams = studioIdOrParams
  }

  if (!resend) {
    // Log instead of actually sending when not configured
    console.log("[EMAIL SIMULATION]", { studioId, ...emailParams })
    return { success: true, messageId: "simulated-" + Date.now() }
  }

  try {
    let fromAddress: string
    let replyDomain = FALLBACK_DOMAIN
    let replyTo: string

    if (studioId) {
      // Studio email - get studio config
      const studio = await db.studio.findUnique({
        where: { id: studioId },
        include: { emailConfig: true }
      })

      if (!studio) {
        return { success: false, error: "Studio not found" }
      }

      // Build from address - use studio's verified domain or fallback
      if (studio.emailConfig?.domainStatus === "verified" && studio.emailConfig.domain) {
        // Use studio's verified domain
        const fromEmail = studio.emailConfig.fromEmail 
          ? `${studio.emailConfig.fromEmail}@${studio.emailConfig.domain}` 
          : `hello@${studio.emailConfig.domain}`
        fromAddress = `${studio.emailConfig.fromName || studio.name} <${fromEmail}>`
        replyDomain = studio.emailConfig.domain
      } else {
        // Fallback: subdomain@notify.thecurrent.app
        fromAddress = `${studio.name} <${studio.subdomain}@${FALLBACK_DOMAIN}>`
      }

      // Generate thread ID for tracking replies
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const threadId = emailParams.clientId 
        ? `s_${studioId}_c_${emailParams.clientId}_${messageId}`
        : `s_${studioId}_${messageId}`

      // Create trackable reply-to address
      replyTo = emailParams.replyTo || `reply+${threadId}@${replyDomain}`
    } else {
      // HQ/Sales email - use platform from address
      fromAddress = emailParams.from || `${PLATFORM_FROM_NAME} <${PLATFORM_FROM_EMAIL}>`
      replyTo = emailParams.replyTo || PLATFORM_FROM_EMAIL
    }

    const htmlContent = emailParams.htmlBody || `<p>${emailParams.body.replace(/\n/g, "<br>")}</p>`

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [emailParams.to],
      subject: emailParams.subject,
      html: htmlContent,
      text: emailParams.body,
      replyTo
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error: error.message }
    }

    // Store message in database if studio context
    if (studioId && emailParams.clientId) {
      await db.message.create({
        data: {
          channel: "EMAIL",
          direction: "OUTBOUND",
          status: "SENT",
          subject: emailParams.subject,
          body: emailParams.body,
          htmlBody: htmlContent,
          fromAddress,
          toAddress: emailParams.to,
          toName: emailParams.toName || null,
          threadId: `s_${studioId}_c_${emailParams.clientId}`,
          externalId: data?.id,
          sentAt: new Date(),
          studioId,
          clientId: emailParams.clientId
        }
      })
    }

    return { success: true, messageId: data?.id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Email Error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Initiate a call (returns TwiML for browser-based calling)
export async function initiateCall(params: MakeCallParams): Promise<{ success: boolean; callSid?: string; error?: string }> {
  if (!twilioClient) {
    console.log("[CALL SIMULATION]", params)
    return { success: true, callSid: "simulated-" + Date.now() }
  }

  try {
    const call = await twilioClient.calls.create({
      to: params.to,
      from: params.from || process.env.TWILIO_PHONE_NUMBER!,
      record: params.recordCall ?? true,
      statusCallback: params.callbackUrl,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      url: `${process.env.NEXTAUTH_URL}/api/twilio/voice`, // TwiML endpoint
    })
    return { success: true, callSid: call.sid }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Call Error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Generate Twilio capability token for browser calling
export async function getTwilioToken(identity: string): Promise<string | null> {
  if (!twilioClient || !process.env.TWILIO_APP_SID || !process.env.TWILIO_API_KEY || !process.env.TWILIO_API_SECRET) {
    return null
  }

  const AccessToken = twilio.jwt.AccessToken
  const VoiceGrant = AccessToken.VoiceGrant

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_APP_SID,
    incomingAllow: true,
  })

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity }
  )

  token.addGrant(voiceGrant)
  return token.toJwt()
}

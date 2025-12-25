import twilio from "twilio"
import nodemailer from "nodemailer"

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

// Email transporter
const emailTransporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

export interface SendSMSParams {
  to: string
  message: string
  from?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  body: string
  from?: string
  replyTo?: string
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
    email: !!emailTransporter,
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    emailConfigured: !!process.env.SMTP_HOST,
  }
}

// Send SMS
export async function sendSMS(params: SendSMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioClient) {
    // Log instead of actually sending when not configured
    console.log("[SMS SIMULATION]", params)
    return { success: true, messageId: "simulated-" + Date.now() }
  }

  try {
    const message = await twilioClient.messages.create({
      to: params.to,
      from: params.from || process.env.TWILIO_PHONE_NUMBER,
      body: params.message,
    })
    return { success: true, messageId: message.sid }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("SMS Error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Send Email
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!emailTransporter) {
    // Log instead of actually sending when not configured
    console.log("[EMAIL SIMULATION]", params)
    return { success: true, messageId: "simulated-" + Date.now() }
  }

  try {
    const info = await emailTransporter.sendMail({
      from: params.from || process.env.SMTP_FROM || "noreply@soulflow.com",
      to: params.to,
      subject: params.subject,
      html: params.body.replace(/\n/g, "<br>"),
      text: params.body,
      replyTo: params.replyTo,
    })
    return { success: true, messageId: info.messageId }
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

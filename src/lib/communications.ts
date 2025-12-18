import { db } from "@/lib/db"

// Types
export interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  body: string
  htmlBody?: string
  clientId?: string
  campaignId?: string
  automationId?: string
}

export interface SendSmsOptions {
  to: string
  toName?: string
  body: string
  clientId?: string
  campaignId?: string
  automationId?: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  externalId?: string
  error?: string
}

// Variable replacement helper
export function replaceVariables(
  template: string, 
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
  }
  return result
}

// Email Service
export async function sendEmail(
  studioId: string, 
  options: SendEmailOptions
): Promise<SendResult> {
  try {
    // Get email config for studio
    const emailConfig = await db.studioEmailConfig.findUnique({
      where: { studioId },
    })

    if (!emailConfig) {
      return { success: false, error: "Email not configured for this studio" }
    }

    if (!emailConfig.fromEmail) {
      return { success: false, error: "From email not configured" }
    }

    // Create message record
    const message = await db.message.create({
      data: {
        studioId,
        channel: "EMAIL",
        direction: "OUTBOUND",
        status: "QUEUED",
        fromAddress: emailConfig.fromEmail,
        fromName: emailConfig.fromName,
        toAddress: options.to,
        toName: options.toName,
        subject: options.subject,
        body: options.body,
        htmlBody: options.htmlBody,
        clientId: options.clientId,
        campaignId: options.campaignId,
        automationId: options.automationId,
      },
    })

    // Send based on provider
    let externalId: string | undefined
    
    switch (emailConfig.provider) {
      case "sendgrid":
        externalId = await sendViaSendGrid(emailConfig, options)
        break
      case "mailgun":
        externalId = await sendViaMailgun(emailConfig, options)
        break
      case "ses":
        externalId = await sendViaSES(emailConfig, options)
        break
      case "smtp":
        externalId = await sendViaSMTP(emailConfig, options)
        break
      default:
        // For development/testing - just mark as sent
        externalId = `dev-${Date.now()}`
    }

    // Update message as sent
    await db.message.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId,
      },
    })

    return { success: true, messageId: message.id, externalId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// SMS Service  
export async function sendSms(
  studioId: string,
  options: SendSmsOptions
): Promise<SendResult> {
  try {
    // Get SMS config for studio
    const smsConfig = await db.studioSmsConfig.findUnique({
      where: { studioId },
    })

    if (!smsConfig) {
      return { success: false, error: "SMS not configured for this studio" }
    }

    if (!smsConfig.fromNumber) {
      return { success: false, error: "From number not configured" }
    }

    // Check monthly limit
    if (smsConfig.currentMonthUsage >= smsConfig.monthlyLimit) {
      return { success: false, error: "Monthly SMS limit reached" }
    }

    // Create message record
    const message = await db.message.create({
      data: {
        studioId,
        channel: "SMS",
        direction: "OUTBOUND",
        status: "QUEUED",
        fromAddress: smsConfig.fromNumber,
        toAddress: options.to,
        toName: options.toName,
        body: options.body,
        clientId: options.clientId,
        campaignId: options.campaignId,
        automationId: options.automationId,
      },
    })

    // Send based on provider
    let externalId: string | undefined

    switch (smsConfig.provider) {
      case "twilio":
        externalId = await sendViaTwilio(smsConfig, options)
        break
      case "messagebird":
        externalId = await sendViaMessageBird(smsConfig, options)
        break
      case "vonage":
        externalId = await sendViaVonage(smsConfig, options)
        break
      default:
        // For development/testing - just mark as sent
        externalId = `dev-${Date.now()}`
    }

    // Update message as sent and increment usage
    await db.message.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalId,
      },
    })

    // Increment monthly usage
    await db.studioSmsConfig.update({
      where: { studioId },
      data: {
        currentMonthUsage: { increment: 1 },
      },
    })

    return { success: true, messageId: message.id, externalId }
  } catch (error) {
    console.error("Error sending SMS:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Get conversation history for a client
export async function getClientConversation(studioId: string, clientId: string) {
  return db.message.findMany({
    where: {
      studioId,
      clientId,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

// Get all conversations (grouped by client)
export async function getConversations(studioId: string) {
  // Get latest message per client
  const messages = await db.message.findMany({
    where: { studioId },
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
  })

  // Group by client
  const conversationMap = new Map<string, typeof messages>()
  
  for (const message of messages) {
    if (message.clientId) {
      if (!conversationMap.has(message.clientId)) {
        conversationMap.set(message.clientId, [])
      }
      conversationMap.get(message.clientId)!.push(message)
    }
  }

  return Array.from(conversationMap.entries()).map(([clientId, msgs]) => ({
    clientId,
    client: msgs[0].client,
    lastMessage: msgs[0],
    messages: msgs,
    unreadCount: msgs.filter(m => m.direction === "INBOUND" && !m.openedAt).length,
  }))
}

// Provider implementations (stubs - implement with actual SDKs)

interface EmailConfigType {
  apiKey: string | null
  fromEmail: string
  fromName: string
  replyToEmail: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUser: string | null
  smtpPassword: string | null
  smtpSecure: boolean
}

interface SmsConfigType {
  accountSid: string | null
  authToken: string | null
  fromNumber: string
}

async function sendViaSendGrid(
  config: EmailConfigType,
  options: SendEmailOptions
): Promise<string> {
  // In production, use @sendgrid/mail package
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(config.apiKey)
  // const result = await sgMail.send({
  //   to: options.to,
  //   from: { email: config.fromEmail, name: config.fromName },
  //   replyTo: config.replyToEmail,
  //   subject: options.subject,
  //   text: options.body,
  //   html: options.htmlBody,
  // })
  // return result[0].headers['x-message-id']
  
  console.log(`[SendGrid] Sending email to ${options.to}: ${options.subject}`)
  return `sg-${Date.now()}`
}

async function sendViaMailgun(
  config: EmailConfigType,
  options: SendEmailOptions
): Promise<string> {
  // In production, use mailgun.js package
  console.log(`[Mailgun] Sending email to ${options.to}: ${options.subject}`)
  return `mg-${Date.now()}`
}

async function sendViaSES(
  config: EmailConfigType,
  options: SendEmailOptions
): Promise<string> {
  // In production, use @aws-sdk/client-ses package
  console.log(`[SES] Sending email to ${options.to}: ${options.subject}`)
  return `ses-${Date.now()}`
}

async function sendViaSMTP(
  config: EmailConfigType,
  options: SendEmailOptions
): Promise<string> {
  // In production, use nodemailer package
  // const transporter = nodemailer.createTransport({
  //   host: config.smtpHost,
  //   port: config.smtpPort,
  //   secure: config.smtpSecure,
  //   auth: { user: config.smtpUser, pass: config.smtpPassword },
  // })
  // const result = await transporter.sendMail({
  //   from: `"${config.fromName}" <${config.fromEmail}>`,
  //   to: options.to,
  //   subject: options.subject,
  //   text: options.body,
  //   html: options.htmlBody,
  // })
  // return result.messageId
  
  console.log(`[SMTP] Sending email to ${options.to}: ${options.subject}`)
  return `smtp-${Date.now()}`
}

async function sendViaTwilio(
  config: SmsConfigType,
  options: SendSmsOptions
): Promise<string> {
  // In production, use twilio package
  // const client = require('twilio')(config.accountSid, config.authToken)
  // const message = await client.messages.create({
  //   body: options.body,
  //   from: config.fromNumber,
  //   to: options.to,
  // })
  // return message.sid
  
  console.log(`[Twilio] Sending SMS to ${options.to}: ${options.body}`)
  return `tw-${Date.now()}`
}

async function sendViaMessageBird(
  config: SmsConfigType,
  options: SendSmsOptions
): Promise<string> {
  // In production, use messagebird package
  console.log(`[MessageBird] Sending SMS to ${options.to}: ${options.body}`)
  return `mb-${Date.now()}`
}

async function sendViaVonage(
  config: SmsConfigType,
  options: SendSmsOptions
): Promise<string> {
  // In production, use @vonage/server-sdk package
  console.log(`[Vonage] Sending SMS to ${options.to}: ${options.body}`)
  return `vn-${Date.now()}`
}

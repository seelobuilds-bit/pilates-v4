import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { SystemEmailType } from "@prisma/client"

// Default email templates
const defaultTemplates: Array<{
  type: SystemEmailType
  name: string
  subject: string
  body: string
  htmlBody: string
  variables: string[]
}> = [
  {
    type: "BOOKING_CONFIRMATION",
    name: "Booking Confirmation",
    subject: "Your class is booked! {{className}} on {{date}}",
    body: `Hi {{firstName}},

Your booking is confirmed!

Class: {{className}}
Date: {{date}}
Time: {{time}}
Location: {{locationName}}
Instructor: {{teacherName}}

We look forward to seeing you!

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! ✓</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Your booking is confirmed!</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> {{locationName}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Instructor:</strong> {{teacherName}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">We look forward to seeing you!</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "className", "date", "time", "locationName", "teacherName", "studioName"]
  },
  {
    type: "CLASS_CANCELLED_BY_STUDIO",
    name: "Class Cancelled (by Studio)",
    subject: "Class Cancelled: {{className}} on {{date}}",
    body: `Hi {{firstName}},

We're sorry to inform you that the following class has been cancelled:

Class: {{className}}
Date: {{date}}
Time: {{time}}
Location: {{locationName}}

{{cancellationReason}}

We apologize for any inconvenience. Your payment will be refunded automatically.

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Class Cancelled</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">We're sorry to inform you that the following class has been cancelled:</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> {{locationName}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">{{cancellationReason}}</p>
    <p style="color: #6b7280; font-size: 14px;">We apologize for any inconvenience. Your payment will be refunded automatically.</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "className", "date", "time", "locationName", "cancellationReason", "studioName"]
  },
  {
    type: "CLASS_CANCELLED_BY_CLIENT",
    name: "Booking Cancellation Confirmation",
    subject: "Booking Cancelled: {{className}} on {{date}}",
    body: `Hi {{firstName}},

Your booking has been cancelled as requested:

Class: {{className}}
Date: {{date}}
Time: {{time}}
Location: {{locationName}}

We hope to see you at another class soon!

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Booking Cancelled</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Your booking has been cancelled as requested:</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6b7280;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> {{locationName}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">We hope to see you at another class soon!</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "className", "date", "time", "locationName", "studioName"]
  },
  {
    type: "PAYMENT_SUCCESS",
    name: "Payment Successful",
    subject: "Payment Received - {{amount}}",
    body: `Hi {{firstName}},

Thank you! Your payment has been successfully processed.

Amount: {{amount}}
Date: {{date}}
Description: {{description}}

Receipt: {{receiptUrl}}

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Successful ✓</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Thank you! Your payment has been successfully processed.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #059669;">
      <p style="margin: 8px 0; color: #374151;"><strong>Amount:</strong> {{amount}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Description:</strong> {{description}}</p>
    </div>
    <a href="{{receiptUrl}}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">View Receipt</a>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "amount", "date", "description", "receiptUrl", "studioName"]
  },
  {
    type: "PAYMENT_FAILED",
    name: "Payment Failed",
    subject: "Payment Failed - Action Required",
    body: `Hi {{firstName}},

Unfortunately, your payment could not be processed.

Amount: {{amount}}
Reason: {{failureReason}}

Please update your payment method to continue enjoying our classes.

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Failed</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Unfortunately, your payment could not be processed.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 8px 0; color: #374151;"><strong>Amount:</strong> {{amount}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Reason:</strong> {{failureReason}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Please update your payment method to continue enjoying our classes.</p>
    <a href="{{updatePaymentUrl}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">Update Payment Method</a>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "amount", "failureReason", "updatePaymentUrl", "studioName"]
  },
  {
    type: "PAYMENT_REFUND",
    name: "Refund Processed",
    subject: "Refund Processed - {{amount}}",
    body: `Hi {{firstName}},

Your refund has been processed successfully.

Refund Amount: {{amount}}
Original Payment: {{originalDescription}}
Date: {{date}}
Reason: {{refundReason}}

The refund should appear in your account within 5-10 business days, depending on your bank.

If you have any questions, please don't hesitate to reach out.

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Refund Processed</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Your refund has been processed successfully.</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0891b2;">
      <p style="margin: 8px 0; color: #374151;"><strong>Refund Amount:</strong> {{amount}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Original Payment:</strong> {{originalDescription}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Reason:</strong> {{refundReason}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">The refund should appear in your account within 5-10 business days, depending on your bank.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">If you have any questions, please don't hesitate to reach out.</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "amount", "originalDescription", "date", "refundReason", "studioName"]
  },
  {
    type: "PASSWORD_RESET",
    name: "Password Reset",
    subject: "Reset Your Password",
    body: `Hi {{firstName}},

We received a request to reset your password.

Click here to reset your password: {{resetLink}}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">We received a request to reset your password.</p>
    <a href="{{resetLink}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">Reset Password</a>
    <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
    <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "resetLink", "studioName"]
  },
  {
    type: "WELCOME",
    name: "Welcome Email",
    subject: "Welcome to {{studioName}}!",
    body: `Hi {{firstName}},

Welcome to {{studioName}}! We're thrilled to have you join us.

You can now book classes, manage your bookings, and more.

Get started: {{bookingLink}}

We can't wait to see you in class!

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome! 🎉</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Welcome to <strong>{{studioName}}</strong>! We're thrilled to have you join us.</p>
    <p style="color: #374151; font-size: 16px;">You can now book classes, manage your bookings, and more.</p>
    <a href="{{bookingLink}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">Book Your First Class</a>
    <p style="color: #6b7280; font-size: 14px;">We can't wait to see you in class!</p>
    <p style="color: #374151; font-size: 16px; margin-top: 30px;">{{studioName}}</p>
  </div>
</body>
</html>`,
    variables: ["firstName", "lastName", "bookingLink", "studioName"]
  }
]

// GET - Fetch all system email templates for studio
export async function GET() {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if templates exist for this studio
    let templates = await db.systemEmailTemplate.findMany({
      where: { studioId: session.user.studioId },
      orderBy: { type: "asc" }
    })

    // If no templates exist, create all defaults
    if (templates.length === 0) {
      await db.systemEmailTemplate.createMany({
        data: defaultTemplates.map(t => ({
          ...t,
          studioId: session.user.studioId!
        }))
      })

      templates = await db.systemEmailTemplate.findMany({
        where: { studioId: session.user.studioId },
        orderBy: { type: "asc" }
      })
    } else {
      // Check for any missing templates and add them
      const existingTypes = templates.map(t => t.type)
      const missingTemplates = defaultTemplates.filter(dt => !existingTypes.includes(dt.type))
      
      if (missingTemplates.length > 0) {
        await db.systemEmailTemplate.createMany({
          data: missingTemplates.map(t => ({
            ...t,
            studioId: session.user.studioId!
          }))
        })

        // Re-fetch all templates
        templates = await db.systemEmailTemplate.findMany({
          where: { studioId: session.user.studioId },
          orderBy: { type: "asc" }
        })
      }
    }

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Failed to fetch email templates:", error)
    return NextResponse.json({ error: "Failed to fetch email templates" }, { status: 500 })
  }
}

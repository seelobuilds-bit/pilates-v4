import { db } from "@/lib/db"
import { SystemEmailType, SystemSmsType } from "@prisma/client"

/**
 * Default email templates for all studios
 */
const DEFAULT_EMAIL_TEMPLATES: Array<{
  type: SystemEmailType
  name: string
  subject: string
  body: string
  htmlBody: string
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
</html>`
  },
  {
    type: "WAITLIST_NOTIFICATION",
    name: "Waitlist Spot Available",
    subject: "A spot opened up in {{className}}!",
    body: `Hi {{firstName}},

Great news! A spot has opened up in a class you were waiting for:

Class: {{className}}
Date: {{date}}
Time: {{time}}

Claim your spot: {{claimUrl}}

This spot will be held for you for 2 hours.

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Spot Available! 🎉</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Great news! A spot has opened up:</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
    </div>
    <a href="{{claimUrl}}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 10px 0; font-weight: 600;">Claim Your Spot</a>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This spot will be held for 2 hours.</p>
  </div>
</body>
</html>`
  },
  {
    type: "WAITLIST_CONFIRMED",
    name: "Waitlist Spot Confirmed",
    subject: "You're booked! {{className}} on {{date}}",
    body: `Hi {{firstName}},

Great news! Your spot has been confirmed for:

Class: {{className}}
Date: {{date}}
Time: {{time}}

We look forward to seeing you!

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">You're Booked! ✓</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">Your waitlist spot has been confirmed!</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">We look forward to seeing you!</p>
  </div>
</body>
</html>`
  },
  {
    type: "CLASS_CANCELLED_BY_STUDIO",
    name: "Class Cancelled",
    subject: "Class Cancelled: {{className}} on {{date}}",
    body: `Hi {{firstName}},

We're sorry to inform you that your upcoming class has been cancelled:

Class: {{className}}
Date: {{date}}
Time: {{time}}

We apologize for any inconvenience. Your credits have been refunded.

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Class Cancelled</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">We're sorry to inform you that your class has been cancelled:</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Your credits have been refunded. We apologize for any inconvenience.</p>
  </div>
</body>
</html>`
  },
  {
    type: "CLASS_CANCELLED_BY_CLIENT",
    name: "Booking Cancellation Confirmed",
    subject: "Booking Cancelled: {{className}} on {{date}}",
    body: `Hi {{firstName}},

Your booking has been successfully cancelled:

Class: {{className}}
Date: {{date}}
Time: {{time}}

If this was a mistake, you can rebook through our website.

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
    <p style="color: #374151; font-size: 16px;">Your booking has been cancelled:</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6b7280;">
      <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> {{className}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> {{date}}</p>
      <p style="margin: 8px 0; color: #374151;"><strong>Time:</strong> {{time}}</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">If this was a mistake, you can rebook through our website.</p>
  </div>
</body>
</html>`
  },
  {
    type: "PASSWORD_RESET",
    name: "Password Reset",
    subject: "Reset your password - {{studioName}}",
    body: `Hi {{firstName}},

We received a request to reset your password.

Click here to reset: {{resetLink}}

This link will expire in 1 hour. If you didn't request this, please ignore this email.

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
  </div>
</body>
</html>`
  },
  {
    type: "TEACHER_INVITE",
    name: "Teacher Invitation",
    subject: "You're invited to teach at {{studioName}}!",
    body: `Hi {{firstName}},

You've been invited to join {{studioName}} as a teacher!

To get started, please set up your account: {{inviteLink}}

Once you've set your password, you'll be able to:
- View your class schedule
- Track your bookings
- Access teaching resources

We're excited to have you on the team!

{{studioName}}`,
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to the Team! 🎉</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px;">Hi {{firstName}},</p>
    <p style="color: #374151; font-size: 16px;">You've been invited to join <strong>{{studioName}}</strong> as a teacher!</p>
    <a href="{{inviteLink}}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; font-weight: 600;">Set Up Your Account</a>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Once you're set up, you'll be able to:</p>
      <p style="margin: 5px 0; color: #6b7280;">✓ View your class schedule</p>
      <p style="margin: 5px 0; color: #6b7280;">✓ Track your bookings</p>
      <p style="margin: 5px 0; color: #6b7280;">✓ Access teaching resources</p>
    </div>
    <p style="color: #6b7280; font-size: 14px;">We're excited to have you on the team!</p>
  </div>
</body>
</html>`
  },
  {
    type: "CLIENT_WELCOME",
    name: "Client Welcome",
    subject: "Welcome to {{studioName}}!",
    body: `Hi {{firstName}},

Welcome to {{studioName}}! We're thrilled to have you join us.

Your account is ready! You can now:
- Browse and book classes
- View your booking history
- Manage your profile

Ready to book your first class? Visit: {{bookingUrl}}

We can't wait to see you in the studio!

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
    <p style="color: #374151; font-size: 16px;">Welcome to <strong>{{studioName}}</strong>!</p>
    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">Your account is ready! You can now:</p>
      <p style="margin: 5px 0; color: #6b7280;">✓ Browse and book classes</p>
      <p style="margin: 5px 0; color: #6b7280;">✓ View your booking history</p>
      <p style="margin: 5px 0; color: #6b7280;">✓ Manage your profile</p>
    </div>
    <a href="{{bookingUrl}}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 10px 0; font-weight: 600;">Book Your First Class</a>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">We can't wait to see you in the studio!</p>
  </div>
</body>
</html>`
  }
]

/**
 * Default SMS templates for all studios
 */
const DEFAULT_SMS_TEMPLATES: Array<{
  type: SystemSmsType
  name: string
  body: string
}> = [
  {
    type: "BOOKING_CONFIRMATION",
    name: "Booking Confirmation",
    body: "Booking confirmed! {{className}} on {{date}} at {{time}}. See you there! - {{studioName}}"
  },
  {
    type: "CLASS_CANCELLED",
    name: "Class Cancelled",
    body: "{{studioName}}: Your {{className}} class on {{date}} has been cancelled. We apologize for the inconvenience."
  },
  {
    type: "WAITLIST_NOTIFICATION",
    name: "Waitlist Notification", 
    body: "{{studioName}}: A spot opened in {{className}} on {{date}}! Claim it within 2 hours: {{claimUrl}}"
  }
]

/**
 * Create all default email and SMS templates for a studio
 * Should be called when a new studio is created
 */
export async function createDefaultTemplatesForStudio(studioId: string): Promise<void> {
  console.log(`[STUDIO SETUP] Creating default templates for studio ${studioId}`)
  
  try {
    // Create email templates
    for (const template of DEFAULT_EMAIL_TEMPLATES) {
      await db.systemEmailTemplate.upsert({
        where: {
          studioId_type: {
            studioId,
            type: template.type
          }
        },
        create: {
          studioId,
          type: template.type,
          name: template.name,
          subject: template.subject,
          body: template.body,
          htmlBody: template.htmlBody,
          isEnabled: true
        },
        update: {} // Don't update if exists
      })
    }
    console.log(`[STUDIO SETUP] Created ${DEFAULT_EMAIL_TEMPLATES.length} email templates`)

    // Create SMS templates
    for (const template of DEFAULT_SMS_TEMPLATES) {
      await db.systemSmsTemplate.upsert({
        where: {
          studioId_type: {
            studioId,
            type: template.type
          }
        },
        create: {
          studioId,
          type: template.type,
          name: template.name,
          body: template.body,
          isEnabled: true
        },
        update: {} // Don't update if exists
      })
    }
    console.log(`[STUDIO SETUP] Created ${DEFAULT_SMS_TEMPLATES.length} SMS templates`)
    
    console.log(`[STUDIO SETUP] Successfully created all default templates for studio ${studioId}`)
  } catch (error) {
    console.error(`[STUDIO SETUP] Error creating templates for studio ${studioId}:`, error)
    // Don't throw - we don't want template creation failure to block studio creation
  }
}

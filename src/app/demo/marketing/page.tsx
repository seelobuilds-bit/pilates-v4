"use client"

import { MarketingView } from "@/components/studio"
import type { MarketingData } from "@/components/studio"

// Demo marketing data
const demoMarketingData: MarketingData = {
  stats: {
    emailSubscribers: 156,
    smsSubscribers: 89,
    activeAutomations: 5,
    totalAutomations: 7,
    campaignsCount: 3,
    campaignsSent: 1
  },
  automations: [
    { id: "1", name: "Win-back 30 Days", trigger: "CLIENT_INACTIVE", channel: "EMAIL", status: "ACTIVE", totalSent: 234, totalOpened: 156, location: null },
    { id: "2", name: "Birthday Greeting", trigger: "BIRTHDAY", channel: "SMS", status: "ACTIVE", totalSent: 89, totalOpened: 0, location: null },
    { id: "3", name: "Class Reminder", trigger: "CLASS_REMINDER", channel: "EMAIL", status: "ACTIVE", totalSent: 1456, totalOpened: 1234, location: null },
    { id: "4", name: "Welcome Series", trigger: "WELCOME", channel: "EMAIL", status: "ACTIVE", totalSent: 312, totalOpened: 287, location: null },
    { id: "5", name: "Post-Class Thank You", trigger: "CLASS_FOLLOWUP", channel: "EMAIL", status: "ACTIVE", totalSent: 978, totalOpened: 654, location: null },
    { id: "6", name: "Booking Confirmed", trigger: "BOOKING_CONFIRMED", channel: "EMAIL", status: "PAUSED", totalSent: 2345, totalOpened: 1890, location: null },
    { id: "7", name: "Membership Expiring", trigger: "MEMBERSHIP_EXPIRING", channel: "EMAIL", status: "DRAFT", totalSent: 0, totalOpened: 0, location: null },
  ],
  campaigns: [
    { id: "1", name: "December Holiday Special", channel: "EMAIL", status: "SENT", totalRecipients: 156, sentCount: 156, openedCount: 89, clickedCount: 34, sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), scheduledAt: null },
    { id: "2", name: "New Year Classes Promo", channel: "EMAIL", status: "SCHEDULED", totalRecipients: 203, sentCount: 0, openedCount: 0, clickedCount: 0, scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), sentAt: null },
    { id: "3", name: "Flash Sale Weekend", channel: "SMS", status: "DRAFT", totalRecipients: 89, sentCount: 0, openedCount: 0, clickedCount: 0, scheduledAt: null, sentAt: null },
  ],
  templates: [
    { id: "1", name: "Welcome Email", type: "EMAIL", subject: "Welcome to Align Pilates! 🎉", body: "Hi {{firstName}}, welcome to our studio!", variables: ["firstName", "lastName"] },
    { id: "2", name: "Class Reminder", type: "EMAIL", subject: "Your class is tomorrow!", body: "Hi {{firstName}}, just a reminder about your upcoming class...", variables: ["firstName", "className", "classTime"] },
    { id: "3", name: "Win-back Message", type: "EMAIL", subject: "We miss you!", body: "Hi {{firstName}}, it's been a while since we've seen you...", variables: ["firstName", "daysSinceLastVisit"] },
    { id: "4", name: "Birthday Greeting", type: "SMS", subject: null, body: "Happy Birthday {{firstName}}! 🎂 Here's 20% off your next class!", variables: ["firstName"] },
    { id: "5", name: "Post-Class Thank You", type: "EMAIL", subject: "Thanks for coming!", body: "Hi {{firstName}}, thank you for attending {{className}}!", variables: ["firstName", "className"] },
  ],
  segments: []
}

export default function DemoMarketingPage() {
  return (
    <MarketingView 
      data={demoMarketingData} 
      linkPrefix="/demo"
    />
  )
}

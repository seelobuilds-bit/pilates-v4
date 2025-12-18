// ==========================================
// DEMO DATA - Shared across all demo pages
// This file contains all mock data for the demo
// Update this file when the real system changes
// ==========================================

export const demoStudio = {
  id: "demo-studio-1",
  name: "Align Pilates",
  subdomain: "alignpilates",
  primaryColor: "#7c3aed",
}

export const demoUser = {
  firstName: "Sarah",
  lastName: "Chen",
  email: "sarah@alignpilates.com",
  role: "OWNER",
}

// Dashboard Stats
export const demoStats = {
  revenue: 24850,
  revenueChange: 12,
  activeClients: 156,
  totalClients: 203,
  bookings: 342,
  weekBookings: 47,
  churnRate: 4.2,
}

// Upcoming Classes for Dashboard
export const demoUpcomingClasses = [
  { id: "1", name: "Morning Flow Pilates", startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, capacity: 12, _count: { bookings: 8 } },
  { id: "2", name: "Reformer Basics", startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, capacity: 10, _count: { bookings: 10 } },
  { id: "3", name: "Power Pilates", startTime: new Date(Date.now() + 7 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, capacity: 12, _count: { bookings: 5 } },
  { id: "4", name: "Evening Stretch", startTime: new Date(Date.now() + 10 * 60 * 60 * 1000), teacher: { user: { firstName: "Amanda", lastName: "Lopez" } }, capacity: 10, _count: { bookings: 7 } },
  { id: "5", name: "Beginner Mat", startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, capacity: 15, _count: { bookings: 3 } },
]

// Recent Bookings for Dashboard
export const demoRecentBookings = [
  { id: "1", client: { firstName: "Emily", lastName: "Chen" }, classSession: { classType: { name: "Morning Flow Pilates" } }, createdAt: new Date(), status: "CONFIRMED" },
  { id: "2", client: { firstName: "Rachel", lastName: "Kim" }, classSession: { classType: { name: "Reformer Basics" } }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), status: "CONFIRMED" },
  { id: "3", client: { firstName: "Lisa", lastName: "Wang" }, classSession: { classType: { name: "Power Pilates" } }, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), status: "CONFIRMED" },
  { id: "4", client: { firstName: "Michelle", lastName: "Torres" }, classSession: { classType: { name: "Evening Stretch" } }, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), status: "CONFIRMED" },
  { id: "5", client: { firstName: "Anna", lastName: "Lee" }, classSession: { classType: { name: "Beginner Mat" } }, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), status: "WAITLIST" },
]

// Schedule Classes
export const demoScheduleClasses = [
  { id: "1", classType: { name: "Morning Flow Pilates" }, startTime: new Date(), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Main Studio" }, capacity: 12, _count: { bookings: 8 } },
  { id: "2", classType: { name: "Reformer Basics" }, startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, location: { name: "Studio B" }, capacity: 10, _count: { bookings: 10 } },
  { id: "3", classType: { name: "Power Pilates" }, startTime: new Date(Date.now() + 5 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Main Studio" }, capacity: 12, _count: { bookings: 5 } },
  { id: "4", classType: { name: "Evening Stretch" }, startTime: new Date(Date.now() + 9 * 60 * 60 * 1000), teacher: { user: { firstName: "Amanda", lastName: "Lopez" } }, location: { name: "Main Studio" }, capacity: 10, _count: { bookings: 7 } },
  { id: "5", classType: { name: "Reformer Intermediate" }, startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, location: { name: "Studio B" }, capacity: 8, _count: { bookings: 6 } },
  { id: "6", classType: { name: "Mat Express" }, startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), teacher: { user: { firstName: "Amanda", lastName: "Lopez" } }, location: { name: "Main Studio" }, capacity: 15, _count: { bookings: 9 } },
  { id: "7", classType: { name: "Power Pilates" }, startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Main Studio" }, capacity: 12, _count: { bookings: 11 } },
  { id: "8", classType: { name: "Beginner Mat" }, startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, location: { name: "Main Studio" }, capacity: 15, _count: { bookings: 4 } },
  { id: "9", classType: { name: "Reformer Advanced" }, startTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Studio B" }, capacity: 8, _count: { bookings: 8 } },
  { id: "10", classType: { name: "Prenatal Pilates" }, startTime: new Date(Date.now() + 72 * 60 * 60 * 1000), teacher: { user: { firstName: "Amanda", lastName: "Lopez" } }, location: { name: "Studio C" }, capacity: 8, _count: { bookings: 5 } },
  { id: "11", classType: { name: "Mat Flow" }, startTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, location: { name: "Main Studio" }, capacity: 12, _count: { bookings: 7 } },
  { id: "12", classType: { name: "Evening Reformer" }, startTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Studio B" }, capacity: 10, _count: { bookings: 10 } },
  { id: "13", classType: { name: "Morning Flow Pilates" }, startTime: new Date(Date.now() + 96 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Main Studio" }, capacity: 12, _count: { bookings: 10 } },
  { id: "14", classType: { name: "Stretch & Restore" }, startTime: new Date(Date.now() + 96 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), teacher: { user: { firstName: "Amanda", lastName: "Lopez" } }, location: { name: "Main Studio" }, capacity: 15, _count: { bookings: 8 } },
  { id: "15", classType: { name: "Weekend Warrior" }, startTime: new Date(Date.now() + 120 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), teacher: { user: { firstName: "Sarah", lastName: "Mitchell" } }, location: { name: "Main Studio" }, capacity: 12, _count: { bookings: 12 } },
  { id: "16", classType: { name: "Family Pilates" }, startTime: new Date(Date.now() + 120 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), teacher: { user: { firstName: "Jessica", lastName: "Taylor" } }, location: { name: "Main Studio" }, capacity: 10, _count: { bookings: 6 } },
]

// Clients
export const demoClients = [
  { id: "1", firstName: "Emily", lastName: "Chen", email: "emily@email.com", phone: "+1 555-0101", _count: { bookings: 24 }, credits: 8, isActive: true, createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
  { id: "2", firstName: "Rachel", lastName: "Kim", email: "rachel@email.com", phone: "+1 555-0102", _count: { bookings: 18 }, credits: 5, isActive: true, createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) },
  { id: "3", firstName: "Lisa", lastName: "Wang", email: "lisa@email.com", phone: "+1 555-0103", _count: { bookings: 32 }, credits: 12, isActive: true, createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
  { id: "4", firstName: "Michelle", lastName: "Torres", email: "michelle@email.com", phone: "+1 555-0104", _count: { bookings: 8 }, credits: 2, isActive: true, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
  { id: "5", firstName: "Anna", lastName: "Lee", email: "anna@email.com", phone: "+1 555-0105", _count: { bookings: 45 }, credits: 15, isActive: true, createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) },
  { id: "6", firstName: "Sarah", lastName: "Johnson", email: "sarah.j@email.com", phone: "+1 555-0106", _count: { bookings: 12 }, credits: 3, isActive: true, createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  { id: "7", firstName: "Jennifer", lastName: "Park", email: "jennifer@email.com", phone: "+1 555-0107", _count: { bookings: 6 }, credits: 0, isActive: false, createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) },
  { id: "8", firstName: "Amanda", lastName: "Davis", email: "amanda.d@email.com", phone: "+1 555-0108", _count: { bookings: 28 }, credits: 10, isActive: true, createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000) },
  { id: "9", firstName: "Christina", lastName: "Lee", email: "christina@email.com", phone: "+1 555-0109", _count: { bookings: 15 }, credits: 4, isActive: true, createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
  { id: "10", firstName: "Maria", lastName: "Garcia", email: "maria@email.com", phone: "+1 555-0110", _count: { bookings: 22 }, credits: 7, isActive: true, createdAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000) },
]

// Teachers
export const demoTeachers = [
  { id: "1", user: { firstName: "Sarah", lastName: "Mitchell", email: "sarah.m@alignpilates.com" }, specialties: ["Mat", "Reformer", "Power"], _count: { classSessions: 48 }, isActive: true, createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000) },
  { id: "2", user: { firstName: "Jessica", lastName: "Taylor", email: "jessica@alignpilates.com" }, specialties: ["Reformer", "Beginner"], _count: { classSessions: 36 }, isActive: true, createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000) },
  { id: "3", user: { firstName: "Amanda", lastName: "Lopez", email: "amanda@alignpilates.com" }, specialties: ["Prenatal", "Recovery", "Stretch"], _count: { classSessions: 32 }, isActive: true, createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
]

// Class Types
export const demoClassTypes = [
  { id: "1", name: "Reformer Basics", description: "Introduction to reformer fundamentals for beginners", duration: 55, capacity: 10, price: 35, isActive: true },
  { id: "2", name: "Mat Flow", description: "Dynamic mat-based pilates focusing on core strength", duration: 50, capacity: 15, price: 25, isActive: true },
  { id: "3", name: "Power Pilates", description: "High-intensity reformer workout for advanced students", duration: 50, capacity: 12, price: 40, isActive: true },
  { id: "4", name: "Prenatal Pilates", description: "Safe and effective exercises for expecting mothers", duration: 45, capacity: 8, price: 35, isActive: true },
  { id: "5", name: "Reformer Advanced", description: "Challenging sequences for experienced practitioners", duration: 55, capacity: 8, price: 45, isActive: true },
  { id: "6", name: "Morning Flow Pilates", description: "Energizing full-body workout to start your day", duration: 50, capacity: 12, price: 30, isActive: true },
  { id: "7", name: "Evening Stretch", description: "Relaxing stretch and release class", duration: 45, capacity: 10, price: 25, isActive: true },
]

// Locations
export const demoLocations = [
  { id: "1", name: "Main Studio", address: "123 Pilates Way, San Francisco, CA 94102", _count: { classSessions: 98 }, isActive: true },
  { id: "2", name: "Studio B", address: "123 Pilates Way, Suite B, San Francisco, CA 94102", _count: { classSessions: 45 }, isActive: true },
  { id: "3", name: "Downtown", address: "456 Market Street, San Francisco, CA 94105", _count: { classSessions: 58 }, isActive: true },
]

// Marketing Automations
export const demoAutomations = [
  { id: "winback-30", title: "Win-back 30 Days", type: "EMAIL", description: "Send a message to clients who haven't booked in 30 days", enabled: true, iconKey: "TrendingUp", iconBg: "bg-gray-100" },
  { id: "winback-60", title: "Win-back 60 Days", type: "EMAIL", description: "Send a message to clients who haven't booked in 60 days", enabled: true, iconKey: "TrendingUp", iconBg: "bg-gray-100" },
  { id: "birthday", title: "Birthday Message", type: "EMAIL", description: "Send birthday wishes to clients on their special day", enabled: true, iconKey: "Gift", iconBg: "bg-amber-50" },
  { id: "reminder", title: "Class Reminder", type: "EMAIL", description: "Remind clients about their upcoming class (24 hours before)", enabled: true, iconKey: "Bell", iconBg: "bg-red-50" },
  { id: "welcome", title: "Welcome Message", type: "EMAIL", description: "Welcome new clients when they create an account", enabled: true, iconKey: "Sparkles", iconBg: "bg-amber-50" },
]

// Reports Data
export const demoReportsData = {
  revenue: {
    total: 24850,
    byLocation: [
      { name: "Main Studio", amount: 14200 },
      { name: "Studio B", amount: 4500 },
      { name: "Downtown", amount: 6150 },
    ],
    byClassType: [
      { name: "Reformer Basics", amount: 8400 },
      { name: "Power Pilates", amount: 7200 },
      { name: "Mat Flow", amount: 5100 },
      { name: "Other", amount: 4150 },
    ],
  },
  clients: { total: 203, new: 34, active: 156, churned: 12 },
  classes: {
    total: 156,
    byLocation: [
      { name: "Main Studio", count: 98 },
      { name: "Studio B", count: 45 },
      { name: "Downtown", count: 58 },
    ],
    byTeacher: [
      { name: "Sarah Mitchell", count: 48 },
      { name: "Jessica Taylor", count: 56 },
      { name: "Amanda Lopez", count: 52 },
    ],
  },
  bookings: { total: 342, byStatus: [{ status: "Confirmed", count: 312 }, { status: "Cancelled", count: 30 }] },
}

// Inbox Messages
export const demoMessages = [
  { id: "1", client: { firstName: "Emily", lastName: "Chen" }, subject: "Class reschedule request", preview: "Hi, I need to reschedule my Thursday class...", createdAt: new Date(Date.now() - 30 * 60 * 1000), read: false },
  { id: "2", client: { firstName: "Rachel", lastName: "Kim" }, subject: "Membership question", preview: "I was wondering about the unlimited membership...", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), read: true },
  { id: "3", client: { firstName: "Lisa", lastName: "Wang" }, subject: "Thank you!", preview: "Just wanted to say thank you for the amazing class...", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), read: true },
  { id: "4", client: { firstName: "Anna", lastName: "Lee" }, subject: "Private session inquiry", preview: "Do you offer private sessions? I'd like to...", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), read: false },
]

// Payments Data
export const demoPayments = [
  { id: "1", client: { firstName: "Emily", lastName: "Chen" }, amount: 35, description: "Reformer Basics - Dec 17", status: "SUCCEEDED", createdAt: new Date() },
  { id: "2", client: { firstName: "Rachel", lastName: "Kim" }, amount: 40, description: "Power Pilates - Dec 17", status: "SUCCEEDED", createdAt: new Date(Date.now() - 60 * 60 * 1000) },
  { id: "3", client: { firstName: "Lisa", lastName: "Wang" }, amount: 200, description: "10-Class Pack", status: "SUCCEEDED", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "4", client: { firstName: "Anna", lastName: "Lee" }, amount: 149, description: "Monthly Unlimited", status: "SUCCEEDED", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: "5", client: { firstName: "Michelle", lastName: "Torres" }, amount: 35, description: "Prenatal Pilates - Dec 16", status: "SUCCEEDED", createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
]

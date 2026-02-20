// Shared types for studio components
// These define the data shapes that studio pages fetch and demo pages mock

export interface ClassSession {
  id: string
  startTime: Date | string
  endTime: Date | string
  capacity: number
  classType: {
    id: string
    name: string
    color?: string | null
  }
  teacher: {
    user: {
      firstName: string
      lastName: string
    }
  }
  location: {
    id: string
    name: string
  }
  _count: {
    bookings: number
  }
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  isActive: boolean
  createdAt: Date | string
}

export interface Booking {
  id: string
  status: string
  createdAt: Date | string
  client: {
    firstName: string
    lastName: string
  }
  classSession: {
    classType: {
      name: string
    }
    location: {
      name: string
    }
  }
}

export interface Location {
  id: string
  name: string
  address?: string | null
  isActive: boolean
}

export interface Teacher {
  id: string
  isActive: boolean
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface ClassType {
  id: string
  name: string
  description?: string | null
  duration: number
  color?: string | null
}

// Dashboard Data Types
export interface DashboardData {
  greeting: string
  currentDate: string
  currency: string
  selectedRange?: {
    key: "this_month" | "7" | "30" | "90" | "365" | "custom"
    label: string
    compareLabel: string
    startDate: string
    endDate: string
  }
  stats: {
    monthlyRevenue: number
    revenueChange: number
    activeClients: number
    newClientsThisWeek: number
    weekBookings: number
    todayBookings: number
    atRiskClientsCount: number
    churnRate: string
  }
  todayOverview: {
    classCount: number
    bookingsCount: number
    fillRate: number
  }
  todayClasses: ClassSession[]
  upcomingClasses: ClassSession[]
  recentBookings: Booking[]
  atRiskClients: Client[]
  studioStats: {
    locations: number
    teachers: number
    classTypes: number
    totalClients: number
    totalBookings: number
  }
  reportDatapoints: Array<{
    id: string
    title: string
    value: string | number
    description?: string
  }>
}

// Marketing Data Types
export interface Automation {
  id: string
  name: string
  trigger: string
  channel: "EMAIL" | "SMS"
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
  totalSent: number
  totalOpened: number
  location?: {
    id: string
    name: string
  } | null
}

export interface Campaign {
  id: string
  name: string
  channel: "EMAIL" | "SMS"
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED"
  totalRecipients: number
  sentCount: number
  openedCount: number
  clickedCount: number
  scheduledAt?: string | null
  sentAt?: string | null
}

export interface Template {
  id: string
  name: string
  type: "EMAIL" | "SMS"
  subject?: string | null
  body: string
  variables: string[]
}

export interface Segment {
  id: string
  name: string
  description: string
  type: string
  conditions: string[]
}

export interface MarketingData {
  stats: {
    emailSubscribers: number
    smsSubscribers: number
    activeAutomations: number
    totalAutomations: number
    campaignsCount: number
    campaignsSent: number
  }
  automations: Automation[]
  campaigns: Campaign[]
  templates: Template[]
  segments: Segment[]
}

// Vault Data Types
export interface Course {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string
  thumbnailUrl: string | null
  audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS" | "ALL"
  category: string | null
  difficulty: string | null
  pricingType: "FREE" | "ONE_TIME" | "SUBSCRIPTION" | "BUNDLE"
  price: number
  subscriptionPrice: number | null
  subscriptionInterval: string | null
  isPublished: boolean
  isFeatured: boolean
  includeInSubscription: boolean
  enrollmentCount: number
  averageRating: number
  _count: {
    modules: number
    enrollments: number
    reviews: number
  }
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  audience: "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS"
  monthlyPrice: number
  quarterlyPrice: number | null
  yearlyPrice: number | null
  features: string[]
  includesClasses: boolean
  classCreditsPerMonth: number | null
  isActive: boolean
  activeSubscribers: number
  includedCourses: Array<{ id: string; title: string }>
  communityChat: { id: string; isEnabled: boolean } | null
}

export interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  progressPercent: number
  paidAmount: number | null
  course: {
    id: string
    title: string
    price: number
  }
  clientName: string
}

export interface AffiliateLink {
  id: string
  code: string
  clicks: number
  conversions: number
  totalEarnings: number
  teacherName: string
  courseName: string
}

export interface VaultData {
  stats: {
    totalCourses: number
    publishedCourses: number
    totalEnrollments: number
    totalRevenue: number
    activeStudents: number
  }
  courses: Course[]
  subscriptionPlans: SubscriptionPlan[]
  enrollments: Enrollment[]
  affiliateLinks: AffiliateLink[]
  categories: string[]
}

// Leaderboard Data Types
export interface LeaderboardPrize {
  id: string
  position: number
  name: string
  description: string | null
  prizeType: string
  prizeValue: number | null
}

export interface LeaderboardEntry {
  id: string
  rank: number
  previousRank: number | null
  score: number
  participantName: string
}

export interface Leaderboard {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  participantType: string
  timeframe: string
  metricName: string
  metricUnit: string | null
  icon: string | null
  color: string | null
  isFeatured: boolean
  prizes: LeaderboardPrize[]
  entries: LeaderboardEntry[]
  totalEntries: number
}

export interface LeaderboardData {
  studioLeaderboards: Leaderboard[]
  teacherLeaderboards: Leaderboard[]
  myRanks: Record<string, { rank: number; score: number }>
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    earnedCount: number
  }>
}

// Schedule Data Types
export interface ScheduleData {
  classes: ClassSession[]
  classTypes: ClassType[]
  teachers: Teacher[]
  locations: Location[]
}

// Clients Data Types
export interface ClientsData {
  clients: (Client & {
    bookings: { id: string }[]
    _count: { bookings: number }
  })[]
  stats: {
    total: number
    active: number
    new: number
    atRisk: number
  }
}

// Store Data Types
export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  compareAtPrice: number | null
  sku: string | null
  category: string | null
  imageUrl: string | null
  inventory: number
  isActive: boolean
  salesCount: number
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  clientName: string
  itemCount: number
}

export interface StoreData {
  stats: {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
  }
  products: Product[]
  orders: Order[]
}

// Community Data Types
export interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: {
    name: string
    avatar?: string
    role: string
  }
}

export interface CommunityChat {
  id: string
  name: string
  memberCount: number
  lastMessage?: ChatMessage
}

export interface CommunityData {
  chats: CommunityChat[]
  activeChat: {
    id: string
    messages: ChatMessage[]
  } | null
}




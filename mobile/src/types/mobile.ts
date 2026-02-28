export type MobileRole = "OWNER" | "TEACHER" | "CLIENT"

export interface StudioSummary {
  id: string
  name: string
  subdomain: string
  primaryColor?: string | null
  currency?: string | null
}

export interface MobileSessionUser {
  id: string
  role: MobileRole
  email: string
  firstName: string
  lastName: string
  teacherId?: string | null
  clientId?: string | null
  credits?: number | null
  studio: StudioSummary
}

export interface MobileLoginResponse {
  token: string
  expiresIn: number
  user: MobileSessionUser
}

export interface MobileBootstrapResponse {
  role: MobileRole
  studio: StudioSummary
  metrics: Record<string, number>
}

export interface MobileClientPlan {
  id: string
  kind: "PACK" | "WEEKLY"
  status: "active" | "cancelled"
  title: string
  description?: string | null
  autoRenew: boolean
  creditsPerRenewal?: number | null
  pricePerCycle?: number | null
  currency?: string | null
  nextChargeAt?: string | null
  classTypeName?: string | null
  teacherName?: string | null
  locationName?: string | null
  cancelledAt?: string | null
  updatedAt: string
}

export interface MobileClientPlansResponse {
  role: "CLIENT"
  studio: StudioSummary
  plans: MobileClientPlan[]
}

export interface MobileClientPlanCancelResponse {
  success: boolean
  alreadyCancelled: boolean
  message: string
  accessUntil?: string | null
}

export interface MobileStudioBrandingResponse {
  role: MobileRole
  studio: StudioSummary
}

export interface MobileStudioBrandingUpdateResponse {
  success: boolean
  studio: StudioSummary
}

export type MobileReportMetricFormat = "number" | "currency" | "percent"

export interface MobileReportMetric {
  id: string
  label: string
  value: number
  previousValue: number
  changePct: number
  format: MobileReportMetricFormat
}

export interface MobileReportHighlight {
  label: string
  value: string
}

export interface MobileReportSeriesPoint {
  label: string
  start: string
  end: string
  metrics: Record<string, number>
}

export interface MobileReportsResponse {
  role: MobileRole
  studio: StudioSummary
  periodDays: 7 | 30 | 90
  generatedAt: string
  range: {
    start: string
    end: string
  }
  metrics: MobileReportMetric[]
  highlights: MobileReportHighlight[]
  series: MobileReportSeriesPoint[]
}

export interface MobileScheduleItem {
  id: string
  bookingId?: string
  bookingStatus?: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  classType: {
    id: string
    name: string
    price: number
  }
  teacher: {
    id: string
    firstName: string
    lastName: string
  }
  location: {
    id: string
    name: string
  }
}

export interface MobileScheduleResponse {
  role: MobileRole
  studio: StudioSummary
  from: string
  to: string
  items: MobileScheduleItem[]
}

export interface MobileScheduleDetailResponse {
  role: MobileRole
  studio: StudioSummary
  session: {
    id: string
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    remainingSpots: number
    waitlistCount: number
    notes: string | null
    classType: {
      id: string
      name: string
      description: string | null
      duration: number
      price: number
    }
    teacher: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    location: {
      id: string
      name: string
      address: string
      city: string
      state: string
      zipCode: string
    }
    bookingSummary: {
      pending: number
      confirmed: number
      completed: number
      cancelled: number
      noShow: number
    }
  }
  clientBooking?: {
    id: string
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
    paidAmount: number | null
    createdAt: string
    cancelledAt: string | null
  } | null
  canBook?: boolean
  canCheckoutOnWeb?: boolean
  recentBookings?: {
    id: string
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
    paidAmount: number | null
    createdAt: string
    cancelledAt: string | null
    client: {
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

export interface MobileConversationSummary {
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  messageCount: number
  unreadCount: number
  lastMessage: {
    id: string
    direction: "INBOUND" | "OUTBOUND"
    channel: "CHAT" | "EMAIL" | "SMS"
    body: string
    createdAt: string
  } | null
}

export interface MobileInboxMessage {
  id: string
  channel: "CHAT" | "EMAIL" | "SMS"
  direction: "INBOUND" | "OUTBOUND"
  subject?: string | null
  body: string
  fromName?: string | null
  toName?: string | null
  createdAt: string
}

export interface MobileInboxResponse {
  role: MobileRole
  studio: StudioSummary
  conversations?: MobileConversationSummary[]
  messages?: MobileInboxMessage[]
}

export interface MobileInboxThreadResponse {
  role: MobileRole
  studio: StudioSummary
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  messages: MobileInboxMessage[]
}

export interface MobileClientSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  isActive: boolean
  totalBookings: number
  lastBookingAt: string | null
  createdAt: string
}

export interface MobileClientsResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  clients: MobileClientSummary[]
}

export interface MobileClientDetailBooking {
  id: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  createdAt: string
  paidAmount: number
  classSession: {
    startTime: string
    endTime: string
    classType: {
      id: string
      name: string
    }
    teacher: {
      id: string
      firstName: string
      lastName: string
    }
    location: {
      id: string
      name: string
    }
  }
}

export interface MobileClientDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    credits: number
    isActive: boolean
    createdAt: string
    lastBookingAt: string | null
    stats: {
      totalBookings: number
      completedBookings: number
      cancelledBookings: number
      noShowBookings: number
      totalSpent: number
    }
  }
  recentBookings: MobileClientDetailBooking[]
}

export interface MobileClassTypeSummary {
  id: string
  name: string
  description: string | null
  duration: number
  capacity: number
  price: number
  isActive: boolean
  createdAt: string
  upcomingSessions: number
  totalSessions: number
}

export interface MobileClassTypesResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  status: "active" | "all"
  classTypes: MobileClassTypeSummary[]
}

export interface MobileClassTypeDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  classType: {
    id: string
    name: string
    description: string | null
    duration: number
    capacity: number
    price: number
    isActive: boolean
    createdAt: string
  }
  stats: {
    totalSessions: number
    upcomingSessions: number
    totalBookings: number
    completedBookings: number
    fillRate: number
    completionRate: number
    totalRevenue: number
    averageRevenuePerSession: number
  }
  topLocations: {
    location: string
    count: number
  }[]
  recentSessions: {
    id: string
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    teacher: {
      id: string
      firstName: string
      lastName: string
    }
    location: {
      id: string
      name: string
    }
  }[]
}

export interface MobileTeacherSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  bio: string | null
  specialties: string[]
  isActive: boolean
  createdAt: string
  upcomingSessions: number
  totalSessions: number
  payRate: {
    type: "PER_CLASS" | "PER_HOUR" | "PER_STUDENT" | "PERCENTAGE"
    rate: number
    currency: string
  } | null
}

export interface MobileTeachersResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  status: "active" | "all"
  teachers: MobileTeacherSummary[]
}

export interface MobileTeacherDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  teacher: {
    id: string
    firstName: string
    lastName: string
    email: string
    bio: string | null
    specialties: string[]
    isActive: boolean
    createdAt: string
    payRate: {
      type: "PER_CLASS" | "PER_HOUR" | "PER_STUDENT" | "PERCENTAGE"
      rate: number
      currency: string
    } | null
  }
  stats: {
    totalSessions: number
    upcomingSessions: number
    totalBookings: number
    completedBookings: number
    fillRate: number
    completionRate: number
    totalRevenue: number
    averageRevenuePerSession: number
  }
  topClassTypes: {
    classType: string
    count: number
  }[]
  recentSessions: {
    id: string
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    classType: {
      id: string
      name: string
    }
    location: {
      id: string
      name: string
    }
  }[]
}

export interface MobileLocationSummary {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string | null
  isActive: boolean
  createdAt: string
  upcomingSessions: number
  totalSessions: number
}

export interface MobileLocationsResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  status: "active" | "all"
  locations: MobileLocationSummary[]
}

export interface MobileLocationDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  location: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string | null
    isActive: boolean
    createdAt: string
  }
  stats: {
    totalSessions: number
    upcomingSessions: number
    totalBookings: number
    completedBookings: number
    fillRate: number
    completionRate: number
    totalRevenue: number
    averageRevenuePerSession: number
  }
  topClassTypes: {
    classType: string
    count: number
  }[]
  recentSessions: {
    id: string
    startTime: string
    endTime: string
    capacity: number
    bookedCount: number
    classType: {
      id: string
      name: string
    }
    teacher: {
      id: string
      firstName: string
      lastName: string
    }
  }[]
}

export type MobileInvoiceStatus = "DRAFT" | "PENDING" | "SENT" | "PAID" | "CANCELLED"

export interface MobileInvoiceSummary {
  id: string
  invoiceNumber: string
  status: MobileInvoiceStatus
  periodStart: string
  periodEnd: string
  subtotal: number
  tax: number
  total: number
  paidAmount: number | null
  currency: string
  sentAt: string | null
  paidAt: string | null
  createdAt: string
  teacher: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface MobileInvoiceStats {
  total: number
  pending: number
  paid: number
  totalPending: number
  totalPaid: number
}

export interface MobileInvoicesResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  status: "all" | MobileInvoiceStatus
  invoices: MobileInvoiceSummary[]
  stats: MobileInvoiceStats
}

export interface MobileInvoiceDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  invoice: {
    id: string
    invoiceNumber: string
    status: MobileInvoiceStatus
    periodStart: string
    periodEnd: string
    subtotal: number
    tax: number
    taxRate: number
    total: number
    paidAmount: number | null
    paymentMethod: string | null
    paymentReference: string | null
    currency: string
    notes: string | null
    sentAt: string | null
    paidAt: string | null
    createdAt: string
    updatedAt: string
    teacher: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    lineItems: {
      description?: string
      classId?: string
      quantity?: number
      rate?: number
      amount?: number
    }[]
  }
}

export type MobilePaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"

export interface MobilePaymentSummary {
  id: string
  amount: number
  currency: string
  status: MobilePaymentStatus
  description: string | null
  createdAt: string
  receiptUrl: string | null
  failureMessage: string | null
  refundedAmount: number | null
  bookingCount: number
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface MobilePaymentsStats {
  total: number
  pending: number
  succeeded: number
  failed: number
  refunded: number
  grossProcessed: number
  refundedTotal: number
}

export interface MobilePaymentsResponse {
  role: "OWNER"
  studio: StudioSummary
  status: "all" | MobilePaymentStatus
  payments: MobilePaymentSummary[]
  stats: MobilePaymentsStats
}

export interface MobilePaymentDetailResponse {
  role: "OWNER"
  studio: StudioSummary
  payment: {
    id: string
    amount: number
    currency: string
    status: MobilePaymentStatus
    description: string | null
    createdAt: string
    updatedAt: string
    receiptUrl: string | null
    failureMessage: string | null
    refundedAmount: number | null
    refundedAt: string | null
    stripePaymentIntentId: string | null
    stripeChargeId: string | null
    stripeRefundId: string | null
    stripeCheckoutSessionId: string | null
    stripeFee: number | null
    applicationFee: number | null
    netAmount: number | null
    client: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    bookings: {
      id: string
      status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
      createdAt: string
      classSession: {
        id: string
        startTime: string
        classType: {
          id: string
          name: string
        }
      }
    }[]
  }
}

export type MobileCommunityAudience = "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS" | "ALL"

export interface MobileCommunityPlanSummary {
  id: string
  name: string
  audience: MobileCommunityAudience
  chatId: string | null
  isEnabled: boolean
  memberCount: number
}

export interface MobileCommunityMessage {
  id: string
  content: string
  type: string
  createdAt: string
  senderName: string
  senderRole: string
  isMine: boolean
}

export interface MobileCommunityResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  plans: MobileCommunityPlanSummary[]
  activePlanId: string | null
  chat: {
    id: string
    name: string
    audience: MobileCommunityAudience
    memberCount: number
  } | null
  messages: MobileCommunityMessage[]
}

export type MobileMarketingCampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED"
export type MobileMarketingAutomationStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
export type MobileMarketingChannel = "EMAIL" | "SMS"
export type MobileMarketingTrigger =
  | "WELCOME"
  | "CLASS_REMINDER"
  | "CLASS_FOLLOWUP"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "CLIENT_INACTIVE"
  | "BIRTHDAY"
  | "MEMBERSHIP_EXPIRING"
export type MobileMarketingCampaignStatusAction = "cancel"
export type MobileMarketingAutomationStatusAction = "activate" | "pause"

export interface MobileMarketingCampaignSummary {
  id: string
  name: string
  channel: MobileMarketingChannel
  status: MobileMarketingCampaignStatus
  scheduledAt: string | null
  sentAt: string | null
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  failedCount: number
  createdAt: string
}

export interface MobileMarketingAutomationSummary {
  id: string
  name: string
  trigger: string
  channel: MobileMarketingChannel
  status: MobileMarketingAutomationStatus
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  stepCount: number
  updatedAt: string
}

export interface MobileMarketingResponse {
  role: "OWNER"
  studio: StudioSummary
  filters: {
    search: string
  }
  stats: {
    campaignsTotal: number
    campaignsScheduled: number
    campaignsSent: number
    automationsTotal: number
    automationsActive: number
    automationsDraft: number
  }
  campaigns: MobileMarketingCampaignSummary[]
  automations: MobileMarketingAutomationSummary[]
}

export interface MobileMarketingCampaignDetailResponse {
  role: "OWNER"
  studio: StudioSummary
  campaign: {
    id: string
    name: string
    channel: MobileMarketingChannel
    status: MobileMarketingCampaignStatus
    subject: string | null
    body: string
    htmlBody: string | null
    scheduledAt: string | null
    sentAt: string | null
    targetAll: boolean
    totalRecipients: number
    sentCount: number
    deliveredCount: number
    openedCount: number
    clickedCount: number
    failedCount: number
    createdAt: string
    updatedAt: string
    segment: {
      id: string
      name: string
    } | null
    location: {
      id: string
      name: string
    } | null
    template: {
      id: string
      name: string
      type: string
    } | null
  }
  stats: {
    deliveryRate: number
    openRate: number
    clickRate: number
    failureRate: number
  }
  recentMessages: {
    id: string
    channel: "EMAIL" | "SMS"
    direction: "INBOUND" | "OUTBOUND"
    status: string
    toAddress: string
    toName: string | null
    sentAt: string | null
    deliveredAt: string | null
    openedAt: string | null
    clickedAt: string | null
    failedReason: string | null
    createdAt: string
  }[]
}

export interface MobileMarketingCampaignStatusActionResponse {
  success: boolean
  campaign: {
    id: string
    status: MobileMarketingCampaignStatus
    updatedAt: string
  }
}

export interface MobileMarketingCreateCampaignInput {
  name: string
  channel: MobileMarketingChannel
  subject?: string | null
  body: string
  scheduledAt?: string | null
}

export interface MobileMarketingCreateCampaignResponse {
  success: boolean
  campaign: MobileMarketingCampaignSummary
}

export interface MobileMarketingAutomationDetailResponse {
  role: "OWNER"
  studio: StudioSummary
  automation: {
    id: string
    name: string
    trigger: string
    channel: MobileMarketingChannel
    status: MobileMarketingAutomationStatus
    subject: string | null
    body: string
    htmlBody: string | null
    stopOnBooking: boolean
    triggerDelay: number
    triggerDays: number | null
    reminderHours: number | null
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    createdAt: string
    updatedAt: string
    location: {
      id: string
      name: string
    } | null
    template: {
      id: string
      name: string
      type: string
    } | null
  }
  stats: {
    deliveryRate: number
    openRate: number
    clickRate: number
    failureRate: number
  }
  steps: {
    id: string
    stepId: string
    stepOrder: number
    channel: "EMAIL" | "SMS"
    subject: string | null
    body: string
    htmlBody: string | null
    delayMinutes: number
    createdAt: string
    updatedAt: string
  }[]
  recentMessages: {
    id: string
    channel: "EMAIL" | "SMS"
    direction: "INBOUND" | "OUTBOUND"
    status: string
    toAddress: string
    toName: string | null
    sentAt: string | null
    deliveredAt: string | null
    openedAt: string | null
    clickedAt: string | null
    failedReason: string | null
    createdAt: string
  }[]
}

export interface MobileMarketingAutomationStatusActionResponse {
  success: boolean
  automation: {
    id: string
    status: MobileMarketingAutomationStatus
    updatedAt: string
  }
}

export interface MobileMarketingCreateAutomationInput {
  name: string
  trigger: MobileMarketingTrigger
  channel: MobileMarketingChannel
  subject?: string | null
  body: string
  delayMinutes?: number
  stopOnBooking?: boolean
}

export interface MobileMarketingCreateAutomationResponse {
  success: boolean
  automation: MobileMarketingAutomationSummary
}

export type MobileSocialPlatform = "INSTAGRAM" | "TIKTOK"
export type MobileSocialRole = "OWNER" | "TEACHER"
export type MobileSocialFlowStatusAction = "activate" | "pause"

export interface MobileSocialAccountSummary {
  id: string
  platform: MobileSocialPlatform
  username: string
  displayName: string | null
  followerCount: number
  isActive: boolean
  lastSyncedAt: string | null
  flowCount: number
  messageCount: number
}

export interface MobileSocialFlowSummary {
  id: string
  name: string
  triggerType: string
  isActive: boolean
  totalTriggered: number
  totalBooked: number
  updatedAt: string
  account: {
    id: string
    platform: MobileSocialPlatform
    username: string
  }
}

export interface MobileSocialTrackingLinkSummary {
  id: string
  code: string
  campaign: string | null
  source: string
  medium: string
  clicks: number
  conversions: number
  revenue: number
  fullTrackingUrl: string
  createdAt: string
}

export interface MobileSocialResponse {
  role: MobileSocialRole
  studio: StudioSummary
  filters: {
    search: string
  }
  stats: {
    totalAccounts: number
    activeFlows: number
    unreadMessages: number
    unreadConversations: number
    totalTrackingClicks: number
    totalTrackingConversions: number
    totalTrackingRevenue: number
  }
  accounts: MobileSocialAccountSummary[]
  flows: MobileSocialFlowSummary[]
  trackingLinks: MobileSocialTrackingLinkSummary[]
  homework: {
    active: {
      id: string
      status: string
      isCompleted: boolean
      startedAt: string
      completedAt: string | null
      progress: Record<string, number>
      trackingCode: string | null
      fullTrackingUrl: string | null
      homework: {
        id: string
        title: string
        points: number
        moduleTitle: string
        categoryName: string
      }
    } | null
    totals: {
      submissions: number
      active: number
      completed: number
    }
  }
  training: {
    totalModules: number
    completedModules: number
    averageWatchedPercent: number
  }
  trending: {
    id: string
    platform: MobileSocialPlatform
    creatorUsername: string
    category: string | null
    contentStyle: string | null
    viewCount: number
    engagementRate: number
    postUrl: string
  }[]
}

export interface MobileSocialFlowDetailResponse {
  role: MobileSocialRole
  studio: StudioSummary
  flow: {
    id: string
    name: string
    description: string | null
    triggerType: string
    triggerKeywords: string[]
    responseMessage: string
    followUpMessages: {
      message: string
      delayMinutes: number
    }[]
    includeBookingLink: boolean
    bookingMessage: string | null
    isActive: boolean
    totalTriggered: number
    totalResponded: number
    totalBooked: number
    postId: string | null
    postUrl: string | null
    createdAt: string
    updatedAt: string
    account: {
      id: string
      platform: MobileSocialPlatform
      username: string
      displayName: string | null
      followerCount: number
      isActive: boolean
      lastSyncedAt: string | null
    }
  }
  stats: {
    responseRate: number
    bookingRate: number
    clickRateFromEvents: number
    conversionRateFromEvents: number
  }
  trackingLinks: MobileSocialTrackingLinkSummary[]
  recentEvents: {
    id: string
    platformUserId: string
    platformUsername: string | null
    triggerContent: string | null
    triggerType: string
    responseSent: boolean
    responseAt: string | null
    clickedLink: boolean
    clickedAt: string | null
    converted: boolean
    convertedAt: string | null
    bookingId: string | null
    createdAt: string
  }[]
  recentMessages: {
    id: string
    direction: "INBOUND" | "OUTBOUND"
    content: string
    isRead: boolean
    createdAt: string
    platformUserId: string
    platformUsername: string | null
  }[]
}

export interface MobileSocialFlowStatusActionResponse {
  success: boolean
  flow: {
    id: string
    isActive: boolean
    updatedAt: string
  }
}

export type MobileLeaderboardParticipantType = "STUDIO" | "TEACHER"

export interface MobileLeaderboardParticipant {
  id: string
  name: string
  subdomain?: string
  studioId?: string
}

export interface MobileLeaderboardEntry {
  id: string
  studioId: string | null
  teacherId: string | null
  score: number
  rank: number | null
  previousRank: number | null
  lastUpdated: string
  participant: MobileLeaderboardParticipant | null
}

export interface MobileLeaderboardPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  totalEntries: number
  entries: MobileLeaderboardEntry[]
}

export interface MobileLeaderboardSummary {
  id: string
  name: string
  description: string | null
  category: string
  participantType: MobileLeaderboardParticipantType
  timeframe: string
  metricName: string
  metricUnit: string | null
  color: string | null
  icon: string | null
  isFeatured: boolean
  currentPeriod: MobileLeaderboardPeriod | null
}

export interface MobileLeaderboardsResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  participantType: MobileLeaderboardParticipantType
  leaderboards: MobileLeaderboardSummary[]
  myRanks: Record<string, { rank: number; score: number } | null>
}

export interface MobileLeaderboardPrize {
  id: string
  position: number
  name: string
  description: string | null
  prizeType: string
  prizeValue: number | null
  prizeCurrency: string | null
  imageUrl: string | null
  sponsorName: string | null
}

export interface MobileLeaderboardDetailPeriod {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  totalEntries: number
  entries: MobileLeaderboardEntry[]
}

export interface MobileLeaderboardDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  leaderboard: {
    id: string
    name: string
    slug: string
    description: string | null
    category: string
    participantType: MobileLeaderboardParticipantType
    timeframe: string
    metricName: string
    metricUnit: string | null
    higherIsBetter: boolean
    minimumEntries: number
    icon: string | null
    color: string | null
    isFeatured: boolean
    lastCalculated: string | null
    prizes: MobileLeaderboardPrize[]
  }
  activePeriod: MobileLeaderboardDetailPeriod | null
  myEntry: MobileLeaderboardEntry | null
  recentPeriods: MobileLeaderboardDetailPeriod[]
  stats: {
    trackedPeriods: number
    activeTopScore: number | null
    activeAverageScore: number | null
    myRank: number | null
    myScore: number | null
  }
}

export type MobileClassFlowType = "VIDEO" | "PDF" | "ARTICLE" | "QUIZ"
export type MobileClassFlowDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
export type MobileTrainingRequestStatus = "PENDING" | "APPROVED" | "SCHEDULED" | "COMPLETED" | "CANCELLED"

export interface MobileClassFlowProgress {
  isCompleted: boolean
  progressPercent: number
  lastViewedAt: string | null
  completedAt: string | null
  notes: string | null
}

export interface MobileClassFlowContentSummary {
  id: string
  title: string
  description: string | null
  type: MobileClassFlowType
  difficulty: MobileClassFlowDifficulty
  duration: number | null
  videoUrl: string | null
  pdfUrl: string | null
  thumbnailUrl: string | null
  isFeatured: boolean
  tags: string[]
  progress: MobileClassFlowProgress | null
}

export interface MobileClassFlowCategorySummary {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  contentCount: number
  contents: MobileClassFlowContentSummary[]
}

export interface MobileTrainingRequestSummary {
  id: string
  title: string
  status: MobileTrainingRequestStatus
  createdAt: string
  preferredDate1: string | null
  scheduledDate: string | null
}

export interface MobileClassFlowsResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  filters: {
    categoryId: string | null
    type: MobileClassFlowType | null
    difficulty: MobileClassFlowDifficulty | null
    featuredOnly: boolean
    search: string
  }
  stats: {
    categories: number
    totalContent: number
    featuredContent: number
    completedContent: number
    pendingTrainingRequests: number
  }
  categories: MobileClassFlowCategorySummary[]
  featured: MobileClassFlowContentSummary[]
  recentRequests: MobileTrainingRequestSummary[]
}

export interface MobileClassFlowRelatedContentSummary {
  id: string
  title: string
  type: MobileClassFlowType
  difficulty: MobileClassFlowDifficulty
  duration: number | null
  thumbnailUrl: string | null
  isFeatured: boolean
  progress: MobileClassFlowProgress | null
}

export interface MobileClassFlowContentDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  content: {
    id: string
    title: string
    description: string | null
    type: MobileClassFlowType
    difficulty: MobileClassFlowDifficulty
    duration: number | null
    videoUrl: string | null
    pdfUrl: string | null
    thumbnailUrl: string | null
    articlePreview: string | null
    isFeatured: boolean
    tags: string[]
    createdAt: string
    updatedAt: string
    category: {
      id: string
      name: string
      description: string | null
      icon: string | null
      color: string | null
    }
    resourceAvailability: {
      video: boolean
      pdf: boolean
      article: boolean
    }
  }
  progress: MobileClassFlowProgress | null
  relatedContent: MobileClassFlowRelatedContentSummary[]
  recentRequests: MobileTrainingRequestSummary[]
  stats: {
    categoryContentCount: number
    relatedContentCount: number
    requestCount: number
  }
  permissions: {
    canUpdateProgress: boolean
  }
}

export interface MobileStoreProductSummary {
  id: string
  price: number
  compareAtPrice: number | null
  isActive: boolean
  hasCustomLogo: boolean
  customTitle: string | null
  displayOrder: number
  product: {
    id: string
    name: string
    category: string
    images: string[]
    suggestedRetail: number
    inStock: boolean
  }
}

export interface MobileStoreOrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  customerName: string
  createdAt: string
}

export interface MobileStoreSampleOrderSummary {
  id: string
  status: string
  total: number
  createdAt: string
}

export interface MobileStoreOverviewResponse {
  role: "OWNER"
  studio: StudioSummary
  subdomain: string
  filters: {
    search: string
    status: "active" | "all"
  }
  store: {
    isEnabled: boolean
    storeName: string
    storeDescription: string | null
    accentColor: string | null
    products: MobileStoreProductSummary[]
    orders: MobileStoreOrderSummary[]
    sampleOrders: MobileStoreSampleOrderSummary[]
  }
  stats: {
    totalProducts: number
    activeProducts: number
    pendingOrders: number
    totalRevenue: number
  }
}

export interface MobileStoreProductDetailResponse {
  role: "OWNER"
  studio: StudioSummary
  product: {
    id: string
    price: number
    compareAtPrice: number | null
    isActive: boolean
    hasCustomLogo: boolean
    logoUrl: string | null
    logoPlacement: string | null
    customTitle: string | null
    customDescription: string | null
    displayOrder: number
    createdAt: string
    updatedAt: string
    catalog: {
      id: string
      name: string
      slug: string
      description: string
      shortDescription: string | null
      category: string
      images: string[]
      suggestedRetail: number
      baseCost: number
      inStock: boolean
      leadTimeDays: number
      materials: string | null
      careInstructions: string | null
    }
    variants: {
      id: string
      price: number | null
      isActive: boolean
      variant: {
        id: string
        name: string
        sku: string
        size: string | null
        color: string | null
        inStock: boolean
      }
    }[]
  }
  stats: {
    unitsSold: number
    grossSales: number
    pendingFulfillmentUnits: number
  }
  recentOrders: {
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    fulfilledQuantity: number
    variantName: string | null
    order: {
      id: string
      orderNumber: string
      status: string
      paymentStatus: string
      customerName: string
      customerEmail: string
      createdAt: string
      shippedAt: string | null
      deliveredAt: string | null
    }
  }[]
}

export type MobileVaultAudience = "STUDIO_OWNERS" | "TEACHERS" | "CLIENTS" | "ALL"
export type MobileVaultPricingType = "FREE" | "ONE_TIME" | "SUBSCRIPTION" | "BUNDLE"
export type MobileVaultStatus = "all" | "published" | "draft"
export type MobileVaultCoursePublishAction = "publish" | "unpublish"

export interface MobileVaultCourseSummary {
  id: string
  title: string
  slug: string
  subtitle: string | null
  description: string
  thumbnailUrl: string | null
  audience: MobileVaultAudience
  category: string | null
  difficulty: string | null
  pricingType: MobileVaultPricingType
  price: number
  currency: string
  isPublished: boolean
  isFeatured: boolean
  includeInSubscription: boolean
  enrollmentCount: number
  averageRating: number
  moduleCount: number
  reviewCount: number
  createdAt: string
  creatorName: string | null
}

export interface MobileVaultResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  filters: {
    search: string
    audience: "all" | MobileVaultAudience
    status: MobileVaultStatus
  }
  categories: string[]
  courses: MobileVaultCourseSummary[]
  stats: {
    totalCourses: number
    publishedCourses: number
    featuredCourses: number
    totalEnrollments: number
  }
}

export interface MobileVaultCourseDetailResponse {
  role: "OWNER" | "TEACHER"
  studio: StudioSummary
  course: {
    id: string
    title: string
    slug: string
    subtitle: string | null
    description: string
    thumbnailUrl: string | null
    promoVideoUrl: string | null
    audience: MobileVaultAudience
    category: string | null
    tags: string[]
    difficulty: string | null
    pricingType: MobileVaultPricingType
    price: number
    currency: string
    subscriptionInterval: string | null
    subscriptionPrice: number | null
    accessType: string
    accessDays: number | null
    dripIntervalDays: number | null
    hasLiveEvents: boolean
    hasCertificate: boolean
    includeInSubscription: boolean
    isPublished: boolean
    isFeatured: boolean
    enrollmentCount: number
    reviewCount: number
    averageRating: number
    createdAt: string
    updatedAt: string
    publishedAt: string | null
    creator: {
      id: string
      firstName: string
      lastName: string
      email: string
    } | null
  }
  stats: {
    totalEnrollments: number
    activeEnrollments: number
    completedEnrollments: number
    completionRate: number
    averageProgress: number
    totalModules: number
    publishedModules: number
    totalLessons: number
    publishedLessons: number
  }
  instructors: {
    id: string
    role: string
    teacher: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
  modules: {
    id: string
    title: string
    description: string | null
    order: number
    dripDelay: number | null
    isPublished: boolean
    lessonCount: number
    publishedLessons: number
    lessons: {
      id: string
      title: string
      order: number
      contentType: string
      isPreview: boolean
      isPublished: boolean
      videoDuration: number | null
      resourceCount: number
    }[]
  }[]
  recentEnrollments: {
    id: string
    status: string
    enrolledAt: string
    expiresAt: string | null
    completedAt: string | null
    progressPercent: number
    lessonsCompleted: number
    lastAccessedAt: string | null
    paidAmount: number | null
    participant: {
      type: "CLIENT" | "TEACHER" | "OWNER" | "UNKNOWN"
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

export interface MobileVaultCoursePublishActionResponse {
  success: boolean
  course: {
    id: string
    isPublished: boolean
    publishedAt: string | null
    updatedAt: string
  }
}

export type MobilePushPlatform = "IOS" | "ANDROID" | "WEB" | "UNKNOWN"
export type MobilePushCategory = "INBOX" | "BOOKINGS" | "SYSTEM"

export interface MobilePushRegisterParams {
  expoPushToken: string
  platform: MobilePushPlatform
  deviceId?: string | null
  appVersion?: string | null
  buildNumber?: string | null
  notificationCategories?: MobilePushCategory[]
}

export interface MobilePushStatus {
  totalCount: number
  enabledCount: number
  disabledCount: number
  latestSeenAt: string | null
  notificationCategories: MobilePushCategory[]
}

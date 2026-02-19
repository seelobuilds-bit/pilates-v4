export type MobileRole = "OWNER" | "TEACHER" | "CLIENT"

export interface StudioSummary {
  id: string
  name: string
  subdomain: string
  primaryColor?: string | null
}

export interface MobileSessionUser {
  id: string
  role: MobileRole
  email: string
  firstName: string
  lastName: string
  teacherId?: string | null
  clientId?: string | null
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
    channel: "EMAIL" | "SMS"
    body: string
    createdAt: string
  } | null
}

export interface MobileInboxMessage {
  id: string
  channel: "EMAIL" | "SMS"
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

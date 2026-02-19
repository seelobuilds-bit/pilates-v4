import { mobileConfig } from "@/src/lib/config"
import type {
  MobileBootstrapResponse,
  MobileClassFlowsResponse,
  MobileClassTypeDetailResponse,
  MobileClassTypesResponse,
  MobileCommunityMessage,
  MobileCommunityResponse,
  MobileClientDetailResponse,
  MobileClientsResponse,
  MobileInboxResponse,
  MobileInboxThreadResponse,
  MobileInvoiceDetailResponse,
  MobileInvoicesResponse,
  MobileLeaderboardsResponse,
  MobileLoginResponse,
  MobileLocationsResponse,
  MobileLocationDetailResponse,
  MobileMarketingResponse,
  MobilePaymentsResponse,
  MobilePaymentDetailResponse,
  MobilePushRegisterParams,
  MobilePushStatus,
  MobileReportsResponse,
  MobileScheduleDetailResponse,
  MobileScheduleResponse,
  MobileSessionUser,
  MobileSocialResponse,
  MobileStoreOverviewResponse,
  MobileStoreProductDetailResponse,
  MobileTeachersResponse,
  MobileTeacherDetailResponse,
  MobileVaultAudience,
  MobileVaultCourseDetailResponse,
  MobileVaultResponse,
} from "@/src/types/mobile"

interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

let unauthorizedHandler: (() => void) | null = null

export function setMobileApiUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(`${mobileConfig.apiBaseUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = typeof payload?.error === "string" ? payload.error : "Request failed"
      if (response.status === 401) {
        unauthorizedHandler?.()
      }
      throw new ApiError(message, response.status, payload)
    }

    return payload as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out. Check connection and retry.", 408, null)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const mobileApi = {
  login(params: { email: string; password: string; studioSubdomain: string }) {
    return request<MobileLoginResponse>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify(params),
    })
  },

  me(token: string) {
    return request<MobileSessionUser>("/api/mobile/auth/me", {
      method: "GET",
      token,
    })
  },

  bootstrap(token: string) {
    return request<MobileBootstrapResponse>("/api/mobile/bootstrap", {
      method: "GET",
      token,
    })
  },

  reports(token: string, params?: { days?: 7 | 30 | 90 }) {
    const search = new URLSearchParams()
    if (params?.days) search.set("days", String(params.days))
    const path = search.size ? `/api/mobile/reports?${search.toString()}` : "/api/mobile/reports"
    return request<MobileReportsResponse>(path, {
      method: "GET",
      token,
    })
  },

  schedule(token: string, params?: { from?: string; to?: string; mode?: "booked" | "all" }) {
    const search = new URLSearchParams()
    if (params?.from) search.set("from", params.from)
    if (params?.to) search.set("to", params.to)
    if (params?.mode) search.set("mode", params.mode)
    const path = search.size ? `/api/mobile/schedule?${search.toString()}` : "/api/mobile/schedule"

    return request<MobileScheduleResponse>(path, {
      method: "GET",
      token,
    })
  },

  scheduleDetail(token: string, sessionId: string) {
    return request<MobileScheduleDetailResponse>(`/api/mobile/schedule/${sessionId}`, {
      method: "GET",
      token,
    })
  },

  inbox(token: string) {
    return request<MobileInboxResponse>("/api/mobile/inbox", {
      method: "GET",
      token,
    })
  },

  clients(token: string, params?: { search?: string }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    const path = search.size ? `/api/mobile/clients?${search.toString()}` : "/api/mobile/clients"
    return request<MobileClientsResponse>(path, {
      method: "GET",
      token,
    })
  },

  clientDetail(token: string, clientId: string) {
    return request<MobileClientDetailResponse>(`/api/mobile/clients/${clientId}`, {
      method: "GET",
      token,
    })
  },

  classTypes(token: string, params?: { search?: string; status?: "active" | "all" }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    const path = search.size ? `/api/mobile/class-types?${search.toString()}` : "/api/mobile/class-types"
    return request<MobileClassTypesResponse>(path, {
      method: "GET",
      token,
    })
  },

  classTypeDetail(token: string, classTypeId: string) {
    return request<MobileClassTypeDetailResponse>(`/api/mobile/class-types/${classTypeId}`, {
      method: "GET",
      token,
    })
  },

  community(token: string, params?: { planId?: string }) {
    const search = new URLSearchParams()
    if (params?.planId) search.set("planId", params.planId)
    const path = search.size ? `/api/mobile/community?${search.toString()}` : "/api/mobile/community"
    return request<MobileCommunityResponse>(path, {
      method: "GET",
      token,
    })
  },

  marketing(token: string, params?: { search?: string }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    const path = search.size ? `/api/mobile/marketing?${search.toString()}` : "/api/mobile/marketing"
    return request<MobileMarketingResponse>(path, {
      method: "GET",
      token,
    })
  },

  social(token: string, params?: { search?: string }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    const path = search.size ? `/api/mobile/social?${search.toString()}` : "/api/mobile/social"
    return request<MobileSocialResponse>(path, {
      method: "GET",
      token,
    })
  },

  sendCommunityMessage(token: string, params: { planId: string; content: string }) {
    return request<{ message: MobileCommunityMessage }>("/api/mobile/community", {
      method: "POST",
      token,
      body: JSON.stringify(params),
    })
  },

  classFlows(
    token: string,
    params?: {
      categoryId?: string
      type?: "VIDEO" | "PDF" | "ARTICLE" | "QUIZ"
      difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
      featuredOnly?: boolean
      search?: string
    }
  ) {
    const search = new URLSearchParams()
    if (params?.categoryId) search.set("categoryId", params.categoryId)
    if (params?.type) search.set("type", params.type)
    if (params?.difficulty) search.set("difficulty", params.difficulty)
    if (params?.featuredOnly) search.set("featuredOnly", "1")
    if (params?.search) search.set("search", params.search)
    const path = search.size ? `/api/mobile/class-flows?${search.toString()}` : "/api/mobile/class-flows"
    return request<MobileClassFlowsResponse>(path, {
      method: "GET",
      token,
    })
  },

  updateClassFlowProgress(
    token: string,
    contentId: string,
    params: { progressPercent?: number; isCompleted?: boolean; notes?: string | null }
  ) {
    return request<{
      success: boolean
      progress: {
        isCompleted: boolean
        progressPercent: number
        lastViewedAt: string | null
        completedAt: string | null
        notes: string | null
      }
    }>(`/api/mobile/class-flows/${contentId}/progress`, {
      method: "POST",
      token,
      body: JSON.stringify(params),
    })
  },

  teachers(token: string, params?: { search?: string; status?: "active" | "all" }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    const path = search.size ? `/api/mobile/teachers?${search.toString()}` : "/api/mobile/teachers"
    return request<MobileTeachersResponse>(path, {
      method: "GET",
      token,
    })
  },

  teacherDetail(token: string, teacherId: string) {
    return request<MobileTeacherDetailResponse>(`/api/mobile/teachers/${teacherId}`, {
      method: "GET",
      token,
    })
  },

  locations(token: string, params?: { search?: string; status?: "active" | "all" }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    const path = search.size ? `/api/mobile/locations?${search.toString()}` : "/api/mobile/locations"
    return request<MobileLocationsResponse>(path, {
      method: "GET",
      token,
    })
  },

  locationDetail(token: string, locationId: string) {
    return request<MobileLocationDetailResponse>(`/api/mobile/locations/${locationId}`, {
      method: "GET",
      token,
    })
  },

  invoices(token: string, params?: { search?: string; status?: "all" | "DRAFT" | "PENDING" | "SENT" | "PAID" | "CANCELLED" }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    const path = search.size ? `/api/mobile/invoices?${search.toString()}` : "/api/mobile/invoices"
    return request<MobileInvoicesResponse>(path, {
      method: "GET",
      token,
    })
  },

  invoiceDetail(token: string, invoiceId: string) {
    return request<MobileInvoiceDetailResponse>(`/api/mobile/invoices/${invoiceId}`, {
      method: "GET",
      token,
    })
  },

  payments(
    token: string,
    params?: {
      search?: string
      status?: "all" | "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"
    }
  ) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    const path = search.size ? `/api/mobile/payments?${search.toString()}` : "/api/mobile/payments"
    return request<MobilePaymentsResponse>(path, {
      method: "GET",
      token,
    })
  },

  paymentDetail(token: string, paymentId: string) {
    return request<MobilePaymentDetailResponse>(`/api/mobile/payments/${paymentId}`, {
      method: "GET",
      token,
    })
  },

  store(token: string, params?: { search?: string; status?: "active" | "all" }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    const path = search.size ? `/api/mobile/store?${search.toString()}` : "/api/mobile/store"
    return request<MobileStoreOverviewResponse>(path, {
      method: "GET",
      token,
    })
  },

  storeProductDetail(token: string, studioProductId: string) {
    return request<MobileStoreProductDetailResponse>(`/api/mobile/store/products/${studioProductId}`, {
      method: "GET",
      token,
    })
  },

  vault(token: string, params?: { search?: string; status?: "all" | "published" | "draft"; audience?: "all" | MobileVaultAudience }) {
    const search = new URLSearchParams()
    if (params?.search) search.set("search", params.search)
    if (params?.status) search.set("status", params.status)
    if (params?.audience) search.set("audience", params.audience)
    const path = search.size ? `/api/mobile/vault?${search.toString()}` : "/api/mobile/vault"
    return request<MobileVaultResponse>(path, {
      method: "GET",
      token,
    })
  },

  vaultCourseDetail(token: string, courseId: string) {
    return request<MobileVaultCourseDetailResponse>(`/api/mobile/vault/courses/${courseId}`, {
      method: "GET",
      token,
    })
  },

  leaderboards(token: string, params?: { type?: "STUDIO" | "TEACHER" }) {
    const search = new URLSearchParams()
    if (params?.type) search.set("type", params.type)
    const path = search.size ? `/api/mobile/leaderboards?${search.toString()}` : "/api/mobile/leaderboards"
    return request<MobileLeaderboardsResponse>(path, {
      method: "GET",
      token,
    })
  },

  inboxThread(token: string, clientId: string) {
    const search = new URLSearchParams({ clientId })
    return request<MobileInboxThreadResponse>(`/api/mobile/inbox/thread?${search.toString()}`, {
      method: "GET",
      token,
    })
  },

  sendInboxMessage(
    token: string,
    params: { clientId?: string; channel: "EMAIL" | "SMS"; message: string; subject?: string }
  ) {
    return request<{ success: boolean; messageId?: string }>("/api/mobile/inbox/send", {
      method: "POST",
      token,
      body: JSON.stringify(params),
    })
  },

  bookClass(token: string, classSessionId: string) {
    return request<{ success: boolean; bookingId?: string; status?: string }>("/api/mobile/schedule/book", {
      method: "POST",
      token,
      body: JSON.stringify({ classSessionId }),
    })
  },

  cancelBooking(token: string, bookingId: string) {
    return request<{ success: boolean; bookingId?: string; status?: string }>("/api/mobile/schedule/cancel", {
      method: "POST",
      token,
      body: JSON.stringify({ bookingId }),
    })
  },

  logout(token: string) {
    return request<{ success: boolean }>("/api/mobile/auth/logout", {
      method: "POST",
      token,
    })
  },

  registerPushToken(token: string, params: MobilePushRegisterParams) {
    return request<{
      success: boolean
      device?: { id: string; platform: string; isEnabled: boolean; notificationCategories?: string[] }
    }>(
      "/api/mobile/push/register",
      {
        method: "POST",
        token,
        body: JSON.stringify(params),
      }
    )
  },

  unregisterPushToken(token: string, params?: { expoPushToken?: string }) {
    return request<{ success: boolean; disabledCount: number }>("/api/mobile/push/unregister", {
      method: "POST",
      token,
      body: JSON.stringify(params || {}),
    })
  },

  sendPushTest(token: string, params?: { message?: string }) {
    return request<{ success: boolean; attempted: number; sent: number; failed: number; disabled: number }>(
      "/api/mobile/push/test",
      {
        method: "POST",
        token,
        body: JSON.stringify(params || {}),
      }
    )
  },

  pushStatus(token: string) {
    return request<{
      success: boolean
      push: MobilePushStatus
    }>("/api/mobile/push/status", {
      method: "GET",
      token,
    })
  },
}
